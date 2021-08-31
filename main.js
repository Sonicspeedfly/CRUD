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
    sendJSON(response, posts);
});
methods.set('/posts.getById', function({response, searchParams}) {
    const idParam = Number(searchParams.get('id'));
    if((!searchParams.has('id')) || (Number.isNaN(idParam))) {
        sendResponse(response, {status: statusBadRequest});
        return;
    }

    let key;
    for (key in posts) {
        let idpost = Number(`${posts[key].id}`);
        if(idParam === idpost) {
            const post = {
                id: idpost,
                content: `${posts[key].content}`,
                created: `${posts[key].created}`,
            };
            sendJSON(response, post);
            return post;
        }
        if(idParam !== idpost) {
            sendResponse(response, {status: statusNotFound})
            return;
        }
    }
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
        created: Date.now(),
    };

    posts.unshift(post);
    sendJSON(response, post);
});
methods.set('/posts.edit', function(request, response) {});
methods.set('/posts.delete', function(request, response) {});

const server = http.createServer((request, response) => {
    const {pathname, searchParams} = new URL(request.url, `http://${request.headers.host}`);
    
    const method = methods.get(pathname);
    if (method === undefined) {
        sendResponse(response, {status: statusNotFound})
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