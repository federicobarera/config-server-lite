const config_store = 'c:\\Users\\Ira\\config-store';
const git = require('simple-git/promise')(config_store);
const fs = require('fs-extra');
const path = require('path')
const express = require('express')
const app = express();
const port = 3000;
var cacheManager = require('cache-manager');
var memoryCache = cacheManager.caching({store: 'memory', max: 100, ttl: 10/*seconds*/});

async function test() {
    fs.copySync('./test.txt', path.join(config_store, 'test.txt'));
    git.init();
    await git.add(['test.txt'])
    await git.commit('change', 'test.txt', { '--author' : 'pino <>' });
}

async function getConfig(req, res, next) {
    const { entity, id } = req.params;

    const fileName = path.join(config_store, entity, id);

    const ex = await fs.exists(fileName);
    try {
        const file = await fs.readFile(fileName);
    }
    catch(e) {
        console.warn(e);
        res.status(404).send();
    }
    next();
};

async function setConfig(req, res, next) {
    const { entity, id } = req.params;
    const fileName = path.join(entity, id);
    const fullFileName = path.join(config_store, fileName);
    const content = 'test';
    
    await fs.ensureDir(path.dirname(fullFileName));
    await fs.writeFile(fullFileName, content);
    await git.add([fileName])
    await git.commit('change', fileName, { '--author' : 'unknown <>' });

    res.send('OK');
    next();
};

async function getChanges(req, res, next) {
    const { q = 1, unit = 'days' } = req.params;
    var r = await git.raw([`diff`, `--stat`, `@{${q}.${unit}.ago}`]);

    res.send(r);
    next();
}

app.get('/changes', getChanges)

app.get('/:entity/:id', getConfig);
app.post('/:entity/:id', setConfig);



async function init() {
    await git.init()
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}


init();

 //TODO: git init checl
 //TODO: cache
 //TODO: safe