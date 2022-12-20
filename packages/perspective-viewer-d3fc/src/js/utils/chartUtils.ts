/**
 * Define a clamped scaling factor based on the container size for bubble plots.
 *
 * @param {Array} p1 a point as a tuple of `Number`
 * @param {Array} p2 a second point as a tuple of `Number`
 * @returns a function `container -> integer` which calculates a scaling factor
 * from the linear function (clamped) defgined by the input points
 */
export function interpolate_scale([x1, y1], [x2, y2]) {
  const m = (y2 - y1) / (x2 - x1);
  const b = y2 - m * x2;
  return function (container) {
      const node = container.node();
      const shortest_axis = Math.min(node.clientWidth, node.clientHeight);
      return Math.min(y2, Math.max(y1, m * shortest_axis + b));
  };
}