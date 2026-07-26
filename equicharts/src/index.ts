/**
 *       ___           ___                   ___           ___           ___           ___           ___           ___           ___
 *      /\__\         /\__\      ___        /\__\         /\  \         /\  \         /\__\         /\  \         /\  \         /\  \
 *     /:/  /        /:/  /     /\  \      /::|  |       /::\  \       /::\  \       /:/  /        /::\  \       /::\  \        \:\  \
 *    /:/__/        /:/  /      \:\  \    /:|:|  |      /:/\:\  \     /:/\:\  \     /:/__/        /:/\:\  \     /:/\:\  \        \:\  \
 *   /::\__\____   /:/  /       /::\__\  /:/|:|  |__   /::\~\:\  \   /:/  \:\  \   /::\  \ ___   /::\~\:\  \   /::\~\:\  \       /::\  \
 *  /:/\:::::\__\ /:/__/     __/:/\/__/ /:/ |:| /\__\ /:/\:\ \:\__\ /:/__/ \:\__\ /:/\:\  /\__\ /:/\:\ \:\__\ /:/\:\ \:\__\     /:/\:\__\
 *  \/_|:|~~|~    \:\  \    /\/:/  /    \/__|:|/:/  / \:\~\:\ \/__/ \:\  \  \/__/ \/__\:\/:/  / \/__\:\/:/  / \/_|::\/:/  /    /:/  \/__/
 *     |:|  |      \:\  \   \::/__/         |:/:/  /   \:\ \:\__\    \:\  \            \::/  /       \::/  /     |:|::/  /    /:/  /
 *     |:|  |       \:\  \   \:\__\         |::/  /     \:\ \/__/     \:\  \           /:/  /        /:/  /      |:|\/__/     \/__/
 *     |:|  |        \:\__\   \/__/         /:/  /       \:\__\        \:\__\         /:/  /        /:/  /       |:|  |
 *      \|__|         \/__/                 \/__/         \/__/         \/__/         \/__/         \/__/         \|__|
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  LineType,
  PolygonType,
  TooltipShowRule,
  TooltipShowType,
  TooltipIconPosition,
  CandleType,
  YAxisType,
  CandleTooltipRectPosition,
} from './common/Styles';
import type Nullable from './common/Nullable';

import { logError, logTag, logWarn } from './common/utils/logger';

import {
  clone,
  merge,
  isString,
  isNumber,
  isValid,
  isObject,
  isArray,
  isFunction,
  isBoolean,
} from './common/utils/typeChecks';
import {
  formatValue,
  formatPrecision,
  formatBigNumber,
  formatDate,
  formatThousands,
  formatFoldDecimal,
} from './common/utils/format';
import { calcTextWidth } from './common/utils/canvas';
import { IndicatorSeries } from './component/Indicator';

import { type Options, FormatDateType } from './Options';
import ChartImp, { type Chart, DomPosition } from './Chart';

import { checkCoordinateOnArc, drawArc } from './extension/figure/arc';
import { checkCoordinateOnCircle, drawCircle } from './extension/figure/circle';
import {
  checkCoordinateOnLine,
  drawLine,
  getLinearYFromSlopeIntercept,
  getLinearSlopeIntercept,
  getLinearYFromCoordinates,
} from './extension/figure/line';
import {
  checkCoordinateOnPolygon,
  drawPolygon,
} from './extension/figure/polygon';
import { checkCoordinateOnRect, drawRect } from './extension/figure/rect';
import { drawRectText } from './extension/figure/rectText';
import { checkCoordinateOnText, drawText } from './extension/figure/text';

import {
  registerFigure,
  getSupportedFigures,
  getFigureClass,
} from './extension/figure/index';
import {
  registerIndicator,
  getSupportedIndicators,
} from './extension/indicator/index';
import { registerLocale, getSupportedLocales } from './extension/i18n/index';
import {
  registerOverlay,
  getOverlayClass,
  getSupportedOverlays,
} from './extension/overlay/index';
import { registerStyles } from './extension/styles/index';
import { registerYAxis } from './extension/y-axis/index';
import { registerXAxis } from './extension/x-axis/index';

const instances = new Map<string, ChartImp>();
let chartBaseId = 1;

/**
 * Chart version
 * @return {string}
 */
function version(): string {
  return '__VERSION__';
}

/**
 * Init chart instance
 * @param ds
 * @param options
 * @returns {Chart}
 */
function init(ds: HTMLElement | string, options?: Options): Nullable<Chart> {
  logTag();
  let dom: Nullable<HTMLElement>;
  if (isString(ds)) {
    dom = document.getElementById(ds);
  } else {
    dom = ds;
  }
  if (dom === null) {
    logError(
      '',
      '',
      'The chart cannot be initialized correctly. Please check the parameters. The chart container cannot be null and child elements need to be added!!!'
    );
    return null;
  }
  let chart = instances.get(dom.id);
  if (isValid(chart)) {
    logWarn('', '', 'The chart has been initialized on the dom！！！');
    return chart;
  }
  const id = `k_line_chart_${chartBaseId++}`;
  chart = new ChartImp(dom, options);
  chart.id = id;
  dom.setAttribute('k-line-chart-id', id);
  instances.set(id, chart);
  return chart;
}

/**
 * Destroy chart instance
 * @param dcs
 */
function dispose(dcs: HTMLElement | Chart | string): void {
  let id: Nullable<string>;
  if (dcs instanceof ChartImp) {
    id = dcs.id;
  } else {
    let dom: Nullable<HTMLElement>;
    if (isString(dcs)) {
      dom = document.getElementById(dcs);
    } else {
      dom = dcs as HTMLElement;
    }
    id = dom?.getAttribute('k-line-chart-id') ?? null;
  }
  if (id !== null) {
    instances.get(id)?.destroy();
    instances.delete(id);
  }
}

const utils = {
  clone,
  merge,
  isString,
  isNumber,
  isValid,
  isObject,
  isArray,
  isFunction,
  isBoolean,
  formatValue,
  formatPrecision,
  formatBigNumber,
  formatDate,
  formatThousands,
  formatFoldDecimal,
  calcTextWidth,
  getLinearSlopeIntercept,
  getLinearYFromSlopeIntercept,
  getLinearYFromCoordinates,
  checkCoordinateOnArc,
  checkCoordinateOnCircle,
  checkCoordinateOnLine,
  checkCoordinateOnPolygon,
  checkCoordinateOnRect,
  checkCoordinateOnText,
  drawArc,
  drawCircle,
  drawLine,
  drawPolygon,
  drawRect,
  drawText,
  drawRectText,
};

//Export types.
export {
  version,
  init,
  dispose,
  registerFigure,
  getSupportedFigures,
  getFigureClass,
  registerIndicator,
  getSupportedIndicators,
  registerOverlay,
  getSupportedOverlays,
  getOverlayClass,
  registerLocale,
  getSupportedLocales,
  registerStyles,
  registerXAxis,
  registerYAxis,
  utils,
  LineType,
  PolygonType,
  TooltipShowRule,
  TooltipShowType,
  TooltipIconPosition,
  CandleTooltipRectPosition,
  CandleType,
  YAxisType,
  FormatDateType,
  DomPosition,
  IndicatorSeries,
};

export * from './component/Overlay';
export * from './extension/figure/arc';
export * from './extension/figure/circle';
export * from './extension/figure/line';
export * from './extension/figure/polygon';
export * from './extension/figure/rect';
export * from './extension/figure/rectText';
export * from './extension/figure/text';

export { ActionType, type ActionCallback } from './common/Action';
export { default as Animation } from './common/Animation';
export { type default as Axis } from './component/Axis';
export { type default as Bounding } from './common/Bounding';
export { type default as Crosshair } from './common/Crosshair';
export { type default as Coordinate } from './common/Coordinate';
export { type default as DeepPartial } from './common/DeepPartial';
export { type default as LoadDataCallback } from './common/LoadDataCallback';
export { type default as LoadMoreCallback } from './common/LoadMoreCallback';
export { type default as Nullable } from './common/Nullable';
export { type default as Point } from './common/Point';
export { type default as Precision } from './common/Precision';
export { type default as TViewData } from './common/TViewData';
export { type default as VisibleRange } from './common/VisibleRange';

export { type Chart } from './Chart';
export { type CustomApi, LayoutChildType, type Options } from './Options';
export { type Indicator, type IndicatorCreate } from './component/Indicator';
export { type PaneOptions, PanePosition, PaneIdConstants } from './pane/types';
export { type Styles, type YAxisStyle, YAxisPosition } from './common/Styles';
export { UpdateLevel } from './common/Updater';
