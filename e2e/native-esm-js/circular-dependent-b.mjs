import circularDependentA from './circular-dependent-a.mjs';

export default {
  id: 'circularDependentB',
  get moduleA() {
    return circularDependentA;
  },
};
