import circularDependentB from './circular-dependent-b.mjs';

export default {
  id: 'circularDependentA',
  get moduleB() {
    return circularDependentB;
  },
};
