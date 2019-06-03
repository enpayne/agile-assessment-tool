import React, { Component } from 'react';
import axios from 'axios';
import uuidv1 from 'uuid/v1';
import { generateSurveyConfig } from './config/surveyConfig';
import { evaluateScore } from './utils/scoreEvaluator';

import Header from './components/Header';
import Footer from './components/Footer';
import FootNote from './components/FootNote';
import AgileAssessment from './components/AgileAssessment';
import Result from './components/Result';

const PageState = {
  SURVEY: 'SURVEY',
  EVALUATION: 'EVALUATION',
  SAVING_RESULT: 'SAVING_RESULT',
};

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageState: PageState.SURVEY,
      evaluation: undefined,
      surveyConfig: undefined,
      showBanner: true,
      surveyId: uuidv1(),
    };
  }

  async componentDidMount() {
    try {
      if (!this.surveyConfig) {
        const urlParams = new URLSearchParams(window.location.search);
        const env = urlParams.get('env');

        const response = await axios.get(`api/surveyconfig${env ? `?env=${env}` : ''}`);
        const surveyConfig = generateSurveyConfig(response.data);
        this.setState((prevState) => ({
          ...prevState,
          surveyConfig,
          pageState: PageState.SURVEY,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async onComplete(result) {
    const { surveyId } = this.state;

    try {
      const surveyResult = result.data;
      surveyResult.id = surveyId;

      this.setState((prevState) => ({
        ...prevState,
        pageState: PageState.SAVING_RESULT,
      }));

      await axios.post('api/survey', surveyResult);

      const evaluations = evaluateScore(surveyResult);

      this.setState((prevState) => ({
        ...prevState,
        evaluations,
        pageState: PageState.EVALUATION,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  onStart() {
    this.setState((prevState) => ({
      ...prevState,
      pageState: PageState.SURVEY,
    }));
  }

  onValueChange() {
    const { showBanner } = this.state;

    if (!showBanner) {
      return;
    }

    this.setState((prevState) => ({
      ...prevState,
      showBanner: false,
    }));
  }

  getContent() {
    const { pageState, evaluations, surveyId, surveyConfig } = this.state;

    switch (pageState) {
    case PageState.EVALUATION:
      return <Result evaluations={evaluations} surveyId={surveyId} />;
    case PageState.SAVING_RESULT:
      return <div className="spinner">&nbsp;</div>;
    default:
      return (
        <div>
          {surveyConfig && (
            <AgileAssessment
              config={surveyConfig}
              onComplete={(result) => this.onComplete(result)}
              onValueChange={() => this.onValueChange()}
            />
          )}
        </div>
      );
    }
  }

  render() {
    const { showBanner } = this.state;
    const content = this.getContent();

    return (
      <div id="outer">
        <Header showBanner={showBanner} />
        {content}
        <FootNote />
        <Footer />
      </div>
    );
  }
}
