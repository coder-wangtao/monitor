/**
 *
 * @param target html节点
 * @returns
 */

export function htmlElementAsString(target: HTMLElement) {
  const tagName = target.tagName.toLocaleLowerCase();
  if (tagName === 'body') {
    return '';
  }
  let classNames = target.classList.value;
  classNames = classNames !== '' ? ` class='${classNames}'` : '';
}
