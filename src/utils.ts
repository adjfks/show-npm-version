import fs from 'fs';

export function parseNpmPackageName(filePath: string) {
  // 匹配 scoped package，例如 @scope/package
  const scopedPackageRegex = /^@[^/]+\/[^/]+/;
  // 匹配 non-scoped package，例如 package
  const nonScopedPackageRegex = /^[^@][^/]+/;

  // 检查是否是 scoped package
  const scopedMatch = filePath.match(scopedPackageRegex);
  if (scopedMatch) {
    return scopedMatch[0];
  }

  // 检查是否是 non-scoped package
  const nonScopedMatch = filePath.match(nonScopedPackageRegex);
  if (nonScopedMatch) {
    return nonScopedMatch[0];
  }

  // 如果都不匹配，返回 null 表示没有找到 npm 包名
  return null;
}