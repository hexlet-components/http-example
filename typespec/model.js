// import { StateKeys } from "./lib.js";

// // Create a unique key
// const key = StateKeys.customName;
// export function $faker(context, target, name) {
//   // Keep a mapping between the target and a value.
//   context.program.stateMap(key).set(target, name);

//   // Keep an index of a type.
//   context.program.stateSet(key).add(target);
// }
let key = 0;
export function $faker(context, target, name) {
  console.log(target.node)
  // if (target.model) {
  //   console.log(name);
  //   // console.log(context);
  //   console.log(target.model.properties);
  //   // context.program.stateMap(key).set(target, name);
  //   // key += 1;

  //   target.type['x-faker'] = name.value;
  //   console.log('---------------------');
  // }
}
