'use strict';

const http = require('http');
const statusNotFound = 404;
const statusBadRequest = 400;
const statusOk = 200;

let nextId = 1;
const posts = [];

function sendResponse(response, {status = statusOk, headers = {}, body = null}) {
    Object.entries(headers).forEach(function([key, value]) {
        response.setHeader(key, value);
    });
    response.writeHead(status);
    response.end(body);
}

function sendJSON(response, body) {
    sendResponse(response, {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

const methods = new Map();
methods.set('/posts.get', function({response}) {
    const postsNotRemoved = posts.filter(function({removed}) {
        return removed === false;
    });
    sendJSON(response, postsNotRemoved);
});
methods.set('/posts.getById', function({response, searchParams}) {
    const idParam = Number(searchParams.get('id'));
    if ((!searchParams.has('id')) || (Number.isNaN(idParam))) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    let found = false;
    let key;
    for (key in posts) {
        const idpost = Number(`${posts[key].id}`);
        if ((idParam === idpost) && (posts[key].removed === false)) {
            const post = {
                id: idpost,
                content: `${posts[key].content}`,
                removed: posts[key].removed,
                created: `${posts[key].created}`,
            };
            found = true;
            sendJSON(response, post);
            return post;
        }   
    }
    if (found === false) {
        sendResponse(response, {status: statusNotFound});
        return;
    }
    found = false;
});
methods.set('/posts.post', function({response, searchParams}) {
    if (!searchParams.has('content')) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    const content = searchParams.get('content');

    const post = {
        id: nextId++,
        content: content,
        removed: false,
        created: Date.now(),
    };

    posts.unshift(post);
    sendJSON(response, post);
});
methods.set('/posts.edit', function({response, searchParams}) {
    const idParam = Number(searchParams.get('id'));
    if ((!searchParams.has('id')) || (Number.isNaN(idParam)) || (!searchParams.has('content'))) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    let found = false;
    let key;
    for (key in posts) {
        const idpost = Number(`${posts[key].id}`);
        if ((idParam === idpost) && (posts[key].removed === false)) {
            posts[key].content = searchParams.get('content');
            const post = {
                id: idpost,
                content: searchParams.get('content'),
                removed: posts[key].removed,
                created: `${posts[key].created}`,
            };
            found = true;
            sendJSON(response, post);
            return post;
        }   
    }
    if (found === false) {
        sendResponse(response, {status: statusNotFound});
        return;
    }
    found = false;
});
methods.set('/posts.delete', function({response, searchParams}) {
    const idParam = Number(searchParams.get('id'));
    if ((!searchParams.has('id')) || (Number.isNaN(idParam))) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    let found = false;
    let key;
    for (key in posts) {
        const idpost = Number(`${posts[key].id}`);
        if ((idParam === idpost) && (posts[key].removed === false)) {
            posts[key].removed = true;
            const post = {
                id: idpost,
                content: `${posts[key].content}`,
                removed: posts[key].removed,
                created: `${posts[key].created}`,
            };
            found = true;
            sendJSON(response, post);
            return post;
        }   
    }
    if (found === false) {
        sendResponse(response, {status: statusNotFound});
        return;
    }
    found = false;
});
methods.set('/posts.restore', function({response, searchParams}) {
    const idParam = Number(searchParams.get('id'));
    if ((!searchParams.has('id')) || (Number.isNaN(idParam))) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }
    let removed = false;
    let found = false;
    let key;
    for (key in posts) {
        const idpost = Number(`${posts[key].id}`);
        if ((idParam === idpost) && (posts[key].removed === true)) {
            posts[key].removed = false;
            const post = {
                id: idpost,
                content: `${posts[key].content}`,
                removed: posts[key].removed,
                created: `${posts[key].created}`,
            };
            removed = true;
            found = true;
            sendJSON(response, post);
            return post;
        }
        if (idParam === idpost) {
            found = true;
        }
    }
    if (found === false) {
        sendResponse(response, {status: statusNotFound});
        return;
    }
    if (removed === false) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    found = false;
    removed = false;
});

const server = http.createServer((request, response) => {
    const {pathname, searchParams} = new URL(request.url, `http://${request.headers.host}`);
    
    const method = methods.get(pathname);
    if (method === undefined) {
        sendResponse(response, {status: statusNotFound});
        return;
    }

    const params = {
        request,
        response,
        pathname,
        searchParams,
    };

    method(params);
});

const port = 9999;
server.listen(port); 