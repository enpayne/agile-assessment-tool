import React from 'react';
import PropTypes from 'prop-types';
import Tippy from '@tippy.js/react';
import scoreDescriptors from './scoreDescriptors';

import '../../styles/evaluation.scss';

const calculateScore = (total, max) => (100 * total) / max;

const getDescriptor = (evaluation) => {
  if (!(evaluation.name in scoreDescriptors)) {
    return '';
  }

  const score = calculateScore(evaluation.total, evaluation.max);

  if (score <= 25) {
    return scoreDescriptors[evaluation.name][25];
  }
  if (score <= 50) {
    return scoreDescriptors[evaluation.name][50];
  }
  if (score <= 75) {
    return scoreDescriptors[evaluation.name][75];
  }
  return scoreDescriptors[evaluation.name][100];
};

const Evaluation = ({ evaluations }) => (
  <>
    {!!evaluations.length && (
      <div className="scores">
        <p>
          Below is our assessment of how agile your organisation is across several categories, based
          on the answers you provided:
        </p>
        <div>
          {evaluations.map((item) => (
            <div key={item.name} className="scores-container">
              <div className="category-label">{item.name}</div>
              <Tippy
                enabled={item.name in scoreDescriptors && !!getDescriptor(item)}
                content={getDescriptor(item)}
              >
                <div className={`${item.name} score-bar-container`}>
                  <div
                    className="score-bar"
                    style={{ width: `${calculateScore(item.total, item.max)}%` }}
                  >
                    &nbsp;
                  </div>
                </div>
              </Tippy>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
);

Evaluation.propTypes = {
  evaluations: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      total: PropTypes.number.isRequired,
      max: PropTypes.number.isRequired,
    }),
  ),
};

Evaluation.defaultProps = {
  evaluations: [],
};

export default Evaluation;
