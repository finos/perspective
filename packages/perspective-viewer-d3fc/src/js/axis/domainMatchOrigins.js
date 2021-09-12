export default (domain1, domain2) => {
    if (!isMatchable(domain1) || !isMatchable(domain2)) return;

    const ratio1 = originRatio(domain1);
    const ratio2 = originRatio(domain2);

    if (ratio1 > ratio2) {
        domain2[0] = adjustLowerBound(domain2, ratio1);
    } else {
        domain1[0] = adjustLowerBound(domain1, ratio2);
    }
};

const isMatchable = (domain) =>
    domain.length === 2 &&
    !isNaN(domain[0]) &&
    !isNaN(domain[1]) &&
    domain[0] !== domain[1];
const originRatio = (domain) => (0 - domain[0]) / (domain[1] - domain[0]);
const adjustLowerBound = (domain, ratio) => (ratio * domain[1]) / (ratio - 1);
