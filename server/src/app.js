const express = require('express');

const _app = express();
const path = require('path');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const axios = require('axios');
const surveyReader = require('./surveys/surveyReader');

_app.use(bodyParser.json()); // support json encoded bodies
_app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
_app.use('/static', express.static(path.join(__dirname, '../../build/static')));
_app.use(favicon(path.join(__dirname, '../../build/favicon.ico')));

_app.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/../../build/index.html`));
});

function onGetSurveyConfig(req, res) {
  let env = process.env.NODE_ENV;

  if (req.query && req.query.env) {
    env = req.query.env;
  }

  res.json(surveyReader.readSurveyConfig(env));
}

async function app(dbClient) {
  _app.post('/api/survey', (req, res) => onPostSurveyResult(dbClient, req, res));
  _app.post('/api/feedback', (req, res) => onPostFeedback(dbClient, req, res));
  _app.get('/api/surveyconfig', (req, res) => onGetSurveyConfig(req, res));
  _app.post('/api/verifycaptcha', (req, res) => onPostVerifyCaptcha(req, res));
  return _app;
}

async function onPostVerifyCaptcha(req, res) {
  const token = req.body.recaptchaToken;

  if (!token) {
    return res.status(200).json({ success: false });
  }

  try {
    const verification = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret:
          process.env.NODE_ENV === 'test'
            ? '6Ld4zaYUAAAAAEVyyNM9WuF_VJy6LHQOfV_uv_N5'
            : '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
        response: token,
      },
    });

    return res.status(200).json(verification.data);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
}

async function onPostFeedback(db, req, res) {
  try {
    const date = new Date().toISOString();
    const feedback = {
      ...req.body,
      date,
    };

    await db.collection('feedbacks').insertOne(feedback);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
}

async function onPostSurveyResult(db, req, res) {
  try {
    const date = new Date().toISOString();
    const surveyResult = {
      ...req.body,
      date,
    };

    await db.collection('userscores').insertOne(surveyResult);
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
}

module.exports = app;
