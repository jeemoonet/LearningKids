import type { SignQuestion } from './signGenerator'

export interface SignChoiceQuestion extends SignQuestion {
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
}
