/**
 * Streamline menu and multi-file functions 
 * This ibrary that works with boss.js, util.js, and inquirer.js to make code even sleeker!
 * @author e@ericiscool.net
 */
const fs       = require('fs'),
      papa     = require('papaparse'),
      util     = require('../util.js'),
      boss     = require('../boss.js'),
      inquirer = require('inquirer'),
      crypto   = require('crypto'),
      papa     = require('papaparse'),
    // for performance metrics
    { PerformanceObserver, performance } = require('perf_hooks');
let d = {
    db: {},
    dir: '',
    ask:  async (question, choices = false, def = null, multiSelect = false) => {
        let type = choices?choices.constructor == Array?multiSelect?'checkbox':'list':'confirm':'input',
            inquiry = type == 'checkbox' || type == 'list'?{
                name   : 'quest',
                message: question,
                type   : type,
                default: def,
                choices: choices
            }: {
                name: 'quest',
                message: question,
                type: type,
                default: typeof def != 'undefined'?def:''
            },
            ret = (await inquirer.prompt(inquiry)).quest;
        return ret;
    },
    browse: async (startDir = d.dir, message = 'Please select another file or folder.', folder = false) => {
        let missionComplete  = false,
            curPath = startDir.replace(/\\/g, '/').replace(/\/\//g, '/').split('/'),
            nextDir = async () => {
                let getScan = await util.scan(curPath.join('/'),0, true),
                    curScan = getScan.map(a => a.name),
                    lsdir   = folder? ['__thisFolder__'].concat(curScan):curScan,
                    ans     = (await inquirer.prompt({
                        name   : 'next',
                        message: `\n${message}\nCurrent path: ${curPath.join('/').replace(/\\/g, '/').replace(/\/\//g, '/')}`,
                        choices: lsdir.concat('..'),
                        type: 'list'
                    })).next,
                    selDetail = getScan.find(a => a.name == ans),
                    isFile = selDetail?selDetail.size > 0:false;
                switch(ans){
                    case '..':
                        curPath.pop();
                        nextDir();
                        break;
                    case '__thisFolder__':
                        missionComplete = true;
                        break;
                    default:
                        curPath.push(ans);
                        if (isFile) missionComplete = true;
                        else nextDir();
                };
            };
        nextDir();
        await util.wait(() => missionComplete == true);
        return curPath.join('/');
    },
    // Function to conduct distributed bulk file operations operations 
    bulk: {
        fn: async () => {
            try {
                if (!d.config.expand) d.config.expand = {};
                d.expand = {
                    stack      : [],
                    queue      : [],
                    done       : [],
                    ledger     : [],
                    i          : 0,
                    people     : [],
                    peopleStack: [],
                    peopleMap  : {},
                    queueLimit : 1,
                    missionComplete: false,
                    trans      : 0,
                    start      : performance.now(),
                    // Number of files before reconciling - more than your workers but less than your ram in gigs
                    stackLimit: 10,
                    // boss.js settings
                };
                let options = await util.scan(dir, 2);
                d.config.expand.list = await ask('Which directory should be utilized?', options, d.config.expand.list || options[0]);
                d.expand.list = await util.scan(dir+d.config.expand.list+'/', 1);
                let ce = d.config.expand,
                    example = util.fix(await util.read(`${dir+d.config.expand.list+'/'}${d.expand.list[0]}`)),
                    headers = Object.keys(example[0]),
                    ans = await inquirer.prompt([
                        {
                            name: 'idCol',
                            message: 'Which is the unique identifier column?',
                            type: 'list', 
                            choices: headers,
                            default: ce.idCol || headers[0]
                        },{
                            name: 'dateCol',
                            message: 'Which is the date column?',
                            type: 'list', 
                            choices: headers,
                            default: ce.dateCol || headers[0]
                        },{
                            name: 'wideCols',
                            message: 'Which columns would you like to expand?',
                            type: 'checkbox', 
                            choices: headers,
                            default: ce.wideCols || []
                        }
                    ]);
                ans.wideCols = ans.wideCols.filter(a => a != ans.idCol && a != ans.dateCol);
                Object.keys(ans).map(a => d.config.expand[a] = ans[a]);
                await saveConfig();
                boss.init({
                    bossFunction: d.report.expand.bossFunction,
                    workFunction: d.workFunction,
                    evalFunction: d.report.expand.evalFunction,
                    positions   : 6,
                    //d.config.workers,
                    roles       : d.config.roles
                })
                await util.wait(() => d.expand.missionComplete)
            } catch (err){
                console.error(err);
                debugger;
            } finally {
                return true;
            }
        },
        bossFunction: async () => {
            let m = d.expand,
                path = `${dir}${d.config.expand.list}/`;
            m.ledger = [];
            m.list.map(a => m.ledger.push({msg: path+a, type: 'expand'}))
            m.stack = m.stack.concat(m.ledger);
            boss.out(`Starting initial sequence!`)
            m.stack = boss.hireAll(m.stack);
            d.report.expand.update();
        },
        evalFunction:(success, result, task) => {
            if (success) {
                let m        = d.expand,
                    filePath = task.msg,
                    people   = result.people,
                    trans    = result.trans;
                // Add to the transaction count
                m.trans += trans;
                // Add the file to the done stack
                m.done.push(filePath);
                // Add the people to the people stack
                m.peopleStack.push(people)
                // If at the predefined stack limit, run the combine function from above
                if (m.peopleStack.length >= m.stackLimit) d.report.expand.combine();
                let done = m.done.length,
                    stack = m.stack.length,
                    queue = m.queue.length;
                // boss.out(`People appended! ${trans} lines; ${people.length} people; ${stack}/${queue}/${done} SQD;`)
                // What happens when all is done
                // Here it can check if there's enough to proceed with operation && give it another or finish the process
                if (m.stack.length > 0) boss.hire(m.stack.pop())
                else if (boss.cob) d.report.expand.save();
            } else {
                boss.warn(`Task failed for ${task.msg}. Reassigning now`);
                boss.hire(task)
            }
        },
        // What the master function will do every once in a while to reconcile all of the transactions
        combine: () => {
            let m = d.expand,
                ce = d.config.expand;
            boss.out('Initiating Master Trim')
            while (m.peopleStack.length > 0){
                let ps = m.peopleStack.pop();
                if (ps) {
                    while (ps.length > 0) {
                        let p = ps.pop()
                        if (!p) {
                            console.log(`pl = ${pl}`)
                            console.log(`ps.length = ${ps.length}`)
                            console.log(`i = ${i}`)
                            console.log(`people.length = ${people.length}`)
                            debugger;
                        }
                        let pi = m.peopleMap[p[ce.idCol]];
                        // If there is a person
                        if (pi) {
                            //  main person
                            let mp = m.people[pi];
                            // Loop though the columns and append; Doesn't get rid of any duplicates... maybe clean it up here?
                            // More time-consuming method, but cleaner output:
                            ce.wideCols.map(f => {
                                // combine them then..
                                mp[f] = mp[f].concat(p[f])
                                    .sort((a, b) => a[0] - b[0])
                                    // map though the values
                                    .filter((e, i, s) => i == 0 || e[1] != s[i-1][1]);
                            });
                        // If there isn't anyone yet!
                        } else {
                            m.peopleMap[p[ce.idCol]] = m.people.length;
                            m.people.push(p);
                        }
                    }
                } else {
                    debugger;
                }
            }
        },
        table: function clitable(tobj, thead = false){
            let okeys = Object.keys(tobj),
                mKey  = Math.max.apply(this, okeys.map(k => `${k}`.length)),
                ovals = Object.values(tobj),
                mVal  = Math.max.apply(this, ovals.map(k => `${k}`.length)),
                ttop  = (new Array(mVal+mKey+4).fill('-')).join(''),
                rows  = [thead||'codebox table',ttop]
                    .concat(okeys.map((k, i) => `${k+(new Array((mKey - k.length)+1)).fill(' ').join('')}: ${ovals[i]}`));
            rows = rows.join('\n')
            console.log(rows);
            return rows;
        },
        update:() => {
            let m = d.expand,
                _ = d.report.expand;
            if (m.done.length > 0) {
                let totalTime   = performance.now() - m.start,
                    done        = m.done.length,
                    stack       = m.stack.length,
                    queue       = m.queue.length
                    people      = m.people.length,
                    files       = m.done.length,
                    lines       = m.trans,
                    minutes     = +((totalTime/1000)/60).toFixed(2),
                    filesPerMin = files/minutes,
                    linesPerMin = lines/minutes,
                    perTime     = totalTime/m.done.length,
                    remTime     = perTime * (m.stack.length + m.queue.length);
                _.table({
                    'REM'      : remTime.time(),
                    'ETC'      : new Date(remTime+Date.now()).time(),
                    'CUR'      : `${done}/${done+stack+queue}`,
                    'Elapsed'  : `${totalTime.time()}`,
                    '--'       : '--',
                    'People'   : people,
                    'Lines'    : lines,
                    'Files'    : files,
                    'Files/Min': filesPerMin.toFixed(2),
                    'Lines/Min': linesPerMin.toFixed(2)
                }, 'cb progress')
            } else {
                boss.out(`Awaiting first completion!`)
            }
            if (!boss.cob) setTimeout(_.update, 2000)
        },
        save: async () => {
            try {
                let m = d.expand,
                    _ = d.report.expand,
                    ce = d.config.expand;
                boss.out('Initiating FINAL COMBINE!');
                if (m.peopleStack.length > 0) d.report.expand.combine();
                boss.out(`Mission complete! Scanned ${m.ledger.length} files`)
                for (let i = 0, il = m.people.length; i < il; i++){
                    let a = m.people[i];
                    ce.wideCols.map(k => {
                        a[k].map(rowCell => {
                            try {
                                rowCell[0] = rowCell?rowCell[0].date():'';
                            } catch (err) {
                                boss.info(`rowCell was ${JSON.stringify(rowCell)}`)
                                boss.error(err);
                                boss.info('Writing as NA');
                                rowCell[0] = 'NA'
                            }
                        })
                        try {
                            a[k] = a[k].map(l => l.join('\:')).join(';').replace(/\r|\n/g, '')
                        } catch (err) {
                            boss.error(err)
                        }
                    })
                }
                let tempName = 'NRDW_AllPers_Pair_Data.csv';
                boss.out(`Writing Output to ${tempName}`)
                // Odin/TB Method
                let rep = m.people.map(p => {
                    let to = {};
                    to[ce.idCol] = p[ce.idCol]
                    ce.wideCols.map(a => to[a] = p[a]);
                    return to;
                });
                await rep.report(dir+'exports/'+tempName);
                await boss.fire();
                let totalTime   = performance.now() - m.start,
                    people      = m.people.length,
                    files       = m.done.length,
                    lines       = m.trans,
                    minutes     = +((totalTime/1000)/60).toFixed(2),
                    filesPerMin = files/minutes,
                    linesPerMin = lines/minutes;
                _.table({
                    'People'   : people,
                    'Lines'    : lines,
                    'Files'    : files,
                    'Minutes'  : minutes,
                    'Files/Min': filesPerMin,
                    'Lines/Min': linesPerMin
                })
                console.log('Successfully exported to '+tempName)
                d.expand.missionComplete = true;
            } catch(err){
                console.error(err);
                debugger;
            }
        }

    }
}
