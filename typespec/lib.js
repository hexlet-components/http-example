export const $lib = createTypeSpecLibrary({
  // ...
  state: {
    customName: { description: "State for the @customName decorator" },
  },
});

export const StateKeys = $lib.stateKeys;
