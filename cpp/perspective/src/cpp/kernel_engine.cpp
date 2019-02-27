#include <perspective/kernel_engine.h>

namespace perspective {
t_kernel_evaluator::t_kernel_evaluator() {}

t_kernel_evaluator*
get_evaluator() {
    static t_kernel_evaluator* evaluator = new t_kernel_evaluator();
    return evaluator;
}

} // end namespace perspective
