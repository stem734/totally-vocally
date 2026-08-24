export function latestFileUpdatedAt(files) {
  return files.reduce((latest, file) => (!latest || (file.updated && file.updated > latest) ? file.updated : latest), '');
}
