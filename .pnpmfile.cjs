// @hey-api/openapi-ts 0.99 строит код через JS API компилятора (ts.SyntaxKind,
// ts.factory), а у typescript 7 этого API нет: пакет отдаёт только бинарь tsc
// и экспорты unstable/*. Под семёркой генератор падает «Cannot read properties
// of undefined (reading 'AnyKeyword')». Поэтому генератору одному подставляется
// @typescript/typescript6, пакет совместимости от команды TypeScript с прежним
// API, а корень остаётся на семёрке.
//
// Хук, а не overrides или packageExtensions: typescript у генератора
// peer-зависимость, на peer overrides не действуют, а обычную зависимость с тем
// же именем, что у peer, pnpm отбрасывает. Снимать, когда генератор научится
// семёрке.
function readPackage(pkg) {
  if (pkg.name === '@hey-api/openapi-ts') {
    delete pkg.peerDependencies?.typescript;
    pkg.dependencies = {
      ...pkg.dependencies,
      typescript: 'npm:@typescript/typescript6@^6.0.2',
    };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
