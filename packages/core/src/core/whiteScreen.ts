import { StatusCode } from '@monitor/common';
import { Callback, InitOptions } from '@monitor/types';
import { _global, _support } from '@monitor/utils';

//document.readyState的使用
// if (document.readyState === 'loading') {
//   // 页面仍在加载中
//   console.log('页面加载中...');
// } else if (document.readyState === 'interactive') {
//   // DOM 已构建好，页面元素可操作，但其他资源仍在加载
//   console.log('页面DOM已构建完成...');
// } else if (document.readyState === 'complete') {
//   // 页面及其资源已完全加载
//   console.log('页面完全加载完成！');
// }

// document.elementFromPoint 是一个非常实用的 DOM 方法，它返回在指定坐标点处的最顶层可视元素。
// 这个方法用于获取在屏幕某个特定位置上的 DOM 元素，可以在页面上进行点击、鼠标事件的模拟，或者用于一些调试、测试场景。
//该方法返回位于指定坐标点的元素。如果该点没有元素（例如该点是空白区域），返回 null。
//back-end-project注意，它返回的是页面上顶层的元素，而不是该位置下方的所有元素。如果该位置有多个重叠的元素，elementFromPoint 会返回最上层的元素。

/**
 * 检测页面是否白屏
 * @param {function} callback - 回到函数获取检测结果
 * @param {boolean} skeletonProject - 页面是否有骨架屏
 * @param {array} whiteBoxElements - 容器列表，默认值为['html', 'body', '#app', '#root']
 */

export function openWhiteScreen(
  callback: Callback,
  { skeletonProject, whiteBoxElements }: InitOptions
) {
  let _whiteLoopNum = 0;
  const _skeletonInitList: any = []; // 存储初次采样点
  let _skeletonNowList: any = []; // 存储当前采样点

  // 项目有骨架屏
  if (skeletonProject) {
    if (document.readyState != 'complete') {
      idleCallback();
    }
  } else {
    // 页面加载完毕
    if (document.readyState === 'complete') {
      idleCallback();
    } else {
      _global.addEventListener('load', idleCallback);
    }
  }

  // 选中dom点的名称
  function getSelector(element: any) {
    if (element.id) {
      return '#' + element.id;
    } else if (element.className) {
      // div home => div.home
      return (
        '.' +
        element.className
          .split(' ')
          .filter((item: any) => !!item)
          .join('.')
      );
    } else {
      return element.nodeName.toLowerCase();
    }
  }
  // 判断采样点是否为容器节点
  function isContainer(element: HTMLElement) {
    const selector = getSelector(element);
    if (skeletonProject) {
      _whiteLoopNum ? _skeletonNowList.push(selector) : _skeletonInitList.push(selector);
    }
    return whiteBoxElements?.indexOf(selector) != -1;
  }
  // 采样对比
  function sampling() {
    let emptyPoints = 0;
    for (let i = 1; i <= 9; i++) {
      const xElements = document.elementsFromPoint(
        (_global.innerWidth * i) / 10,
        _global.innerHeight / 2
      );
      const yElements = document.elementsFromPoint(
        _global.innerWidth / 2,
        (_global.innerHeight * i) / 10
      );
      if (isContainer(xElements[0] as HTMLElement)) emptyPoints++;
      // 中心点只计算一次
      if (i != 5) {
        if (isContainer(yElements[0] as HTMLElement)) emptyPoints++;
      }
    }
    // console.log('_skeletonInitList', _skeletonInitList, _skeletonNowList);

    // 页面正常渲染，停止轮训
    if (emptyPoints != 17) {
      if (skeletonProject) {
        // 第一次不比较
        if (!_whiteLoopNum) return openWhiteLoop();
        // 比较前后dom是否一致
        if (_skeletonNowList.join() == _skeletonInitList.join())
          return callback({
            status: StatusCode.ERROR,
          });
      }
      if (_support._loopTimer) {
        clearTimeout(_support._loopTimer);
        _support._loopTimer = null;
      }
    } else {
      // 开启轮训
      if (!_support._loopTimer) {
        openWhiteLoop();
      }
    }
    // 17个点都是容器节点算作白屏
    callback({
      status: emptyPoints == 17 ? StatusCode.ERROR : StatusCode.OK,
    });
  }
  // 开启白屏轮训
  function openWhiteLoop(): void {
    if (_support._loopTimer) return;
    _support._loopTimer = setInterval(() => {
      if (skeletonProject) {
        _whiteLoopNum++;
        _skeletonNowList = [];
      }
      idleCallback();
    }, 1000);
  }
  function idleCallback() {
    if ('requestIdleCallback' in _global) {
      requestIdleCallback(deadline => {
        // timeRemaining：表示当前空闲时间的剩余时间
        if (deadline.timeRemaining() > 0) {
          sampling();
        }
      });
    } else {
      sampling();
    }
  }
}
