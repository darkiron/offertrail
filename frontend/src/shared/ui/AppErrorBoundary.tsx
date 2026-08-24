import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useI18n } from '../../i18n';
import classes from './AppErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
  copy: {
    eyebrow: string;
    title: string;
    reload: string;
  };
}
interface State {
  failed: boolean;
}

class AppErrorBoundaryInner extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OfferTrail app area failed', error, info.componentStack);
  }

  render() {
    if (this.state.failed)
      return (
        <section className={classes.fallback} role="alert">
          <p>{this.props.copy.eyebrow}</p>
          <h1>{this.props.copy.title}</h1>
          <button
            type="button"
            onClick={() => {
              this.setState({ failed: false });
              window.location.reload();
            }}
          >
            {this.props.copy.reload}
          </button>
        </section>
      );
    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <AppErrorBoundaryInner
      copy={{
        eyebrow: t('common.errorBoundary.eyebrow'),
        title: t('common.errorBoundary.title'),
        reload: t('common.errorBoundary.reload'),
      }}
    >
      {children}
    </AppErrorBoundaryInner>
  );
}
