const request = require('supertest');
const _app = require('./app');
const { connectToDb, closeDb } = require('./db');

let db;
let server;

beforeAll(async done => {
    process.env.NODE_ENV = 'test';

    db = await connectToDb();
    const app = await _app(db);

    server = app.listen(done);
});

describe('The root path', () => {
    test('It should response the GET method', done => {
        request(server).get('/')
            .expect(200)
            .end(done);
    });
});

describe('The /api/survey path', () => {
    test('It should save the survey result to the DB', done => {
        const payload = {
            someQuestion: 'someAnswer'
        };

        request(server)
            .post('/api/survey')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(200)
            .end(() => {
                db.collection('userscores').findOne(payload).then(document => {
                    expect(document.someQuestion).toBe(payload.someQuestion);
                    done();
                });
            });
    });
});

afterAll(done => {
    server.close(() => {
        closeDb();
        done();
    });
});