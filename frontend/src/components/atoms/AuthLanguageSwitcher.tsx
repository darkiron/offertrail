import { LanguageSwitcher } from './LanguageSwitcher';
import classes from './AuthLanguageSwitcher.module.css';

/** Shared locale control for the standalone authentication funnel. */
export function AuthLanguageSwitcher() {
  return <div className={classes.locale}><LanguageSwitcher /></div>;
}
