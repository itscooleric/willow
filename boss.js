/**
 * BOSS.js by Eric White
 * e@ericiscool.net
 */
let cluster   = require('cluster'),
    chalk     = require('chalk'),
    sp        = new Array(7 - (process.pid+'').length).fill(' ').join(''),
    { spawn } = require('child_process'),
    _         = {
      workers: [],
      online : 0,
      onclock: 0,
      cob    : true,
      employed: false,
    },
    
    /**
     * his function is the main function of your program. Within this function, you can run things as you would normally 
     * when you want to run something using different cores (normally a repeated timeconsuming process), create an array of the items
     * task.hireAll(taskList) will make attempt to run the function specified in workFunction() on the worker and return the result to evalFunction()
     * Can also hireOne(task);
     * No params are needed for this function
     */
    bossFunctionDefault = () => {
        _.out(`DEFAULT MASTER: I can have ${_.positions} workers`);
        _.hireAll(new Array(_.positions).fill('hello'))
    },
    workFunctionDefault = (msg) => new Promise(resolve => {
      _.out(`DEFAULT COMPLETE: ${msg}`)
      resolve(process.pid)
    }),
    evalFunctionDefault = (success, msg, task) => {
      _.out(`DEFAULT EVAL\nSuccess:\t${success}\nResult:\t${msg}\nTask:\t${task}`)
    },
    positionsDefault = require('os').cpus().length-1,
    rolesDefault     = 1;
// TODO STEP THROUGH ENTIRE PROCESS AND MAKE SURE IS SOUND THEN UPDATE NRDW OPER
_.conLog = msg => {
    // if (msg.stack) return `${msg.message}\n${msg.stack}`
    // else if (/obj/i.test(typeof msg)){
    if (/obj/i.test(typeof msg)){
        let tj = JSON.stringify(msg);
        if (tj =='{}') {
            let te = (new Error().stack.toString().split('\n')[3].match(/\((.*)\)/)||['',''])[1];
            te = te.length > 0?`\t[${te.slice(te.lastIndexOf('\\'))}]`:'';
            return `${tj}${te}`
        }
        else return tj;
    } else {
        // let te = (new Error().stack.toString().split('\n')[3].match(/\((.*)\)/)||['',''])[1];
        // te = te.length > 0?`\t[${te.slice(te.lastIndexOf('\\'))}]`:'';
        // // return `${msg}\nfrom: ${(new Error().stack.toString().match(/\((.*)\)/)||['',''])[1]}`;
        // return `${msg}${te}`;
        return msg?msg.stack||msg:'no msg :[';
    }
};
_.conFrm = ()  => !cluster.isMaster? chalk.cyan('[W'+process.pid+']'+sp):chalk.red('[M'+process.pid+']'+sp);
_.out    = msg => console.log(_.conFrm()+_.conLog(msg))
_.error  = msg => console.error(_.conFrm()+chalk.red(_.conLog(msg)))
_.warn   = msg => console.log(_.conFrm()+chalk.yellow(_.conLog(msg)))
_.info   = msg => console.log(_.conFrm()+chalk.magenta(_.conLog(msg)))
_.pylog  = msg => console.log(chalk.cyan('[PYTHON]'+sp)+msg);
_.pyerr  = msg => console.log(chalk.cyan('[PYTHON]'+sp)+chalk.red(msg));

_.cluster = cluster;
_.isMaster = cluster.isMaster;
/** 
 * Initializes the multi-core functions
 * @param {bossFunction} function Function that the master runs; The bossFunction body of your function
 * @param {workFunction} function Function that the worker runs; This function generally takes in an argument that is that data
 * @param {evalFunction} function Function that evaluates results; Should take three arguments:
 *      Success/Failure - did they complete it successfully,
 *      Msg - the results if it was a sucess or the original assignment if it failed,
 *      Worker - the worker that did or failed to do the work
 * @description CALL THIS AT THE BOTTOM OUTSIDE OF YOUR MAIN FUNCTION!
 */
_.init = mission => {
    _.bossFunction  = mission.bossFunction  || bossFunctionDefault;  
    _.workFunction  = mission.workFunction  || workFunctionDefault;
    _.evalFunction  = mission.evalFunction  || evalFunctionDefault;
    _.roles         = mission.roles         || rolesDefault;
    _.positions     = mission.positions     || positionsDefault;
    if (cluster.isMaster) masterInit();
    else childInit();
}


// ********************************
//      MASTER FUNCTION SECTION
// Launches all of the workers based on the number of CPUs
// ********************************
async function masterInit() {
    let fork = async () => {
            let conline  = _.online,
                workerID = _.workers.length,
                worker   = cluster.fork();
            // _.out(`Forking process ${workerID}...`);
            worker.tasks = []; worker.complete = []; worker.failed = []; worker.alive = false;
            _.workers.push(worker);
            worker.on('message', msg => masterRecv(msg, worker));
            console.log(`Forking ${_.online+1}/${_.positions}`)
            // await _.wait(() => _.online != conline);
            return true;
        },
        forkItAll = async () => {
            let i = _.online;
            while (i < _.positions){
                fork();
                try {
                    await _.wait(() => _.online > i, 4000)
                    i++;
                } catch (err) {
                    _.warn('Wait limit exceeded, re-forking...')
                }
            }
        };
    _.fork = fork;
    // Fork workers
    // for (let i = 0; i < _.positions; i++) fork();
    forkItAll();
   
    // What happens when someone fails
    cluster.on('exit', function(worker, code, signal) {
        // task.out('Señor, Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        let poorGuy = _.workers.find(a => a.process.pid = worker.process.pid),
            rework  = poorGuy.tasks.slice(0);
        _.onclock--;
        if (_.onclock == 0) _.cob = true;
        poorGuy.failed         = poorGuy.failed.concat(rework);
        poorGuy.alive          = false;
        // Let the master know what happened
        rework.map(r => _.masterRecv({
            success: false,
            result : 'Señor, Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal,
            task   : r
        }))
        fork();
    });
    
    // Begins the bossFunction process
    try {
        _.out(`Interviewing ${_.positions} workers`)
        await _.wait(() => _.online == _.positions)
        _.out(`Everyone has checked in! Starting functions`)
        _.bossFunction();
    } catch(err) {
        console.error(err);
        _.error(`Issue with initializing bossFunction`)
        _.error(err);
    };
}
/**
 * Assigns work to the specified worker; does not check if the worker can do work. Should only be used in the task module as other functions check
 * @param worker a worker function to complete the worker (normally generated from _.canHire())
 * @param task the argument for the worker to "complete"
 * 
 * Does not return anything
 */
_.assign = function sendMsgToWorkerProcess(worker, task) {
    _.onclock++;
    _.cob = false;
    worker.tasks.push(task)
    worker.send(task);
}
/**
 * Checks if a worker is available and returns them if so, or false if not
 */
_.canHire = function findWorkerAvailableForWork() {
    let available = _.workers.filter(a => a.alive && a.tasks.length < _.roles)
    if (available.length > 0) return available.sort((a, b) => a.tasks.length - b.tasks.length)[0];
    else return false;
}
/**
 * Hires one worker to complete a task
 * @param task {} agruement interpreted by the workFunction function described in the main function to be completed by worker
 * @returns worker if successful or false if not
 */
_.hireOne = function hireWorkerWithTask(task) {
    let worker = _.canHire();
    if (worker){
        _.assign(worker, task)
        return worker;
    } else {
        // _.warn('No workers currently available to complete the task');
        return false;
    }    
}
_.hire = function hireSafely(task){
    if (!task) return false;
    else if (task.constructor == Array) return _.hireAll(task)
    else return _.hireOne(task)
}
/**
 * Hires as many workers as possible to complete tasks in the main argument
 * @param {Array} tasks an array of tasks to be complete by the workers
 * @returns list of tasks that were not completed
 * 
 * @example fileQueue = task.hireAll(fileQueue); // Assigns all the work that can be and updates the taskList
 */
_.hireAll = function hireAllWorkersWithTask(tasks = []) {
    try {
        if (tasks.length == 0) {
            _.warn('No tasks were included in the task list; No work was assigned')
            return false;
        } else {
            // let canWork = _.workers.filter(a => a.tasks.length < _.roles)
            let pool = [];
            _.workers
                .filter(a => a.tasks.length < _.roles && a.alive)
                .map(a => {
                    for (let i = a.tasks.length; i < _.roles; i++) pool.push({worker: a, quality: i})
                }
            );
            pool = pool.sort((a, b) => a.quality - b.quality)
            // Push a worker to the pool for every task they can do
            // canWork.map(w => pool = pool.concat(new Array(_.roles - w.tasks.length).fill(w)))
            // can also do: (let wi = _.roles - w.tasks.length; wi >= 0; wi--) pool.push(w)
            // Remove the tasks to be assigned from the list and assign them to the workers in the pool
            // Nothing happens to extra workers and he extra tasks get returned
            tasks.splice(0, pool.length).map((t, i) => _.assign(pool[i].worker, t))
            return tasks;
        }
    } catch (err) {
        _.error(err);
    }
}

// Master handler for receiving messages; What should master do with result?
function masterRecv(work, guy){
    try {
        if (work == 'im online') {
            // guy.process.pid -- pid
            _.workers.find(a => a.process.pid == guy.process.pid).alive = true;
            _.online++;
            // _.out('Worker checked in; total online is '+_.online) 
            
        } else {
            // _.out(`Got a msg from ${work.pid}`)
            _.onclock--;
            if  (_.onclock == 0) _.cob = true;
            let task                   = work.task,
                taskID                 = guy.tasks.indexOf(task),
                spliced                = guy.tasks.splice(taskID, 1);
            // If mission is complete successfully
            if (work.success) guy.complete.push(spliced)
            else guy.failed.push(spliced)

            // Work evaluation function
            _.evalFunction(work.success, work.result, task)

        }
    } catch (err) {
        console.error(err)
    }
}

// ********************************
//      CHILD FUNCTION SECTION
// ********************************
function childInit() {
    process.send('im online')

    // _.wait(() => _.employed == true, 100000)
    // .then(() => {
        // _.out('I got the job!')
        process.on('message', msg => workerRecv(msg));
        process.on('error', err => {
            _.err(err)
        })
    // })
    // .catch((err) => {
    //     console.log('never got employed :(')
    //     process.exit(1);
    // })
}   

function report(msg) {
    process.send(Object.assign({pid:process.pid}, msg));
}
// Worker handler for receiving messages; What should the worker do?
function workerRecv(task){
    // _.out(`I got message: ${task}`)
    // console.log(`gottAK: ${JSON.stringify(task)}`)
    // debugger;
    // if (task == "you're hired"){
    //     _.employed = true;
    // }
    _.workFunction(task)
    .then(res => {
        report({ success: true, result: res, task: task})
    })
    .catch(err => report({ success: false, result: err, task: task}))
}
_.wait = (cb, timeout = 0, interval = 500) => new Promise((resolve, reject) => {
    let start = Date.now(), endLimit = timeout > 0 ? start + timeout : Infinity,
        tick = () => {
            let p, fail = false;
            try { p = cb()} catch (err) { p = false; fail = err;}
            if (p != false && typeof p != 'undefined' && p != null && p != undefined) resolve(p);
            else if (fail) reject(fail);
            else {
                if (Date.now() > endLimit) reject(false);
                else setTimeout(tick, interval);
            }
        };
    tick();
})

// ********************************
//      PYTHON FUNCTION SECTION
// Runs python scripts and handles outputs (INCOMPLETE!)
// ********************************
_.python = {
    spawns: [],
    run: (file, args, datacb = r => _.pylog(r), errcb = r => _.pyerr(r)) => new Promise((resolve, reject) => {
        _.pylog(`Running ${[file].concat(args).join(' ')}`)
        let projectPath = '', //the path of your project
            pythawn     = spawn('python', [file].concat(args), {cwd: projectPath});
        pythawn.alive   = true;
        pythawn.id      = _.python.spawns.length;
        pythawn.stdout.on('data', function(data) {
            datacb(data.toString())
        });
        pythawn.stderr.on('data', (data) => {
            errcb(data.toString())
        });
        pythawn.write = msg => {
            if (pythawn.alive) {
                pythawn.stdin.write(msg)
                return true;
            } else {
                return false
            }
        }
        pythawn.on('exit', (code, signal) => {
            _.pyerr(`Exited with code ${code} signal ${signal}`)
            resolve(true);
        })
        pythawn.on('error', err => {
            _.pyerr(err)
        })
        _.python.spawns.push(pythawn);
        return pythawn;
    })   
}
module.exports = _;

