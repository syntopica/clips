/** The grader's own label for what it found. It exists so the label and the
 * list can disagree in public: a model that describes problems in its summary
 * while returning an empty list used to print as `clean`, and nothing in code
 * could tell that apart from a page with nothing wrong. */
export type GradeVerdict = 'clean' | 'unsupported'
