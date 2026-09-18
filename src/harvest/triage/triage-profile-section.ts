/** The paragraph telling the classifier whose interests it judges for. An
 * instance that configured no profile gets a neutral line instead of an empty
 * gap, so the prompt still reads as a sentence and the model is not left to
 * invent an owner. */
export const triageProfileSection = (profile: string): string =>
  profile.trim() === ''
    ? 'No interest profile is configured. Judge each article on general technical\nusefulness to a working software developer.'
    : profile.trim()
