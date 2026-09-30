/** The tier a page written by a model on the owner's own machine occupies.
 *
 * No grader runs on it today, so ruling it out frees every existing tier - a
 * page the local model wrote is read back by a different model on another
 * account, which is the split the guard exists for. It is named so that the day
 * a local grader is added, its tier is this one and the guard already refuses
 * it for a local author. */
export const LOCAL_GRADE_TIER = 'local'
