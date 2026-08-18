import { Component, type ErrorInfo, type ReactNode } from 'react';
import classes from './AppErrorBoundary.module.css';

interface Props { children: ReactNode }
interface State { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OfferTrail app area failed', error, info.componentStack);
  }

  render() {
    if (this.state.failed) return <section className={classes.fallback} role="alert"><p>La zone n’a pas pu s’afficher</p><h1>Votre session et vos données sont intactes.</h1><button type="button" onClick={() => { this.setState({ failed: false }); window.location.reload(); }}>Recharger cette page</button></section>;
    return this.props.children;
  }
}
