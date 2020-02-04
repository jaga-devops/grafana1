import React, { PureComponent } from 'react';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { stylesFactory, Forms } from '@grafana/ui';
import config from 'app/core/config';

import { PanelModel } from '../../state/PanelModel';
import { DashboardModel } from '../../state/DashboardModel';
import { DashboardPanel } from '../../dashgrid/DashboardPanel';
import { QueriesTab } from '../../panel_editor/QueriesTab';
import { StoreState } from '../../../../types/store';
import { connect } from 'react-redux';
import { updateLocation } from '../../../../core/reducers/location';

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  wrapper: css`
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: ${theme.zIndex.modal};
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${theme.colors.pageBg};
    display: flex;
    padding: ${theme.spacing.md};
    flex-direction: row;
  `,
  leftPane: css`
    flex-grow: 1;
    height: 100%;
  `,
  rightPane: css`
    width: 450px;
    height: 100%;
    flex-grow: 0;
  `,
  leftPaneViz: css`
    width: 100%;
    height: 50%;
  `,
  leftPaneData: css`
    width: 100%;
    height: 50%;
    padding-top: ${theme.spacing.md};
  `,
}));

interface Props {
  dashboard: DashboardModel;
  panel: PanelModel;
  updateLocation: typeof updateLocation;
}

interface State {
  dirtyPanel?: PanelModel;
}

export class PanelEditor extends PureComponent<Props, State> {
  state: State = {};

  constructor(props: Props) {
    super(props);
    const { panel } = props;
    const dirtyPanel = new PanelModel(panel.getSaveModel());
    dirtyPanel.setQueryRunner(panel.getQueryRunner().clone());
    dirtyPanel.isNewEdit = true;
    this.state = { dirtyPanel };
  }

  render() {
    const { dashboard, panel } = this.props;
    const { dirtyPanel } = this.state;

    const styles = getStyles(config.theme);

    if (!dirtyPanel) {
      return null;
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.leftPane}>
          <div className={styles.leftPaneViz}>
            <DashboardPanel
              dashboard={dashboard}
              panel={dirtyPanel}
              isEditing={false}
              isInEditMode
              isFullscreen={false}
              isInView={true}
            />
          </div>
          <div className={styles.leftPaneData}>
            <QueriesTab panel={dirtyPanel} dashboard={dashboard} />
          </div>
        </div>
        <div className={styles.rightPane}>
          <Forms.Button
            onClick={() => {
              dirtyPanel.setQueryRunner(panel.getQueryRunner());
              this.props.dashboard.updatePanel(dirtyPanel);
            }}
          >
            Save
          </Forms.Button>
          <Forms.Button
            variant="destructive"
            onClick={() => {
              this.props.updateLocation({
                query: { editPanel: null },
                partial: true,
              });
            }}
          >
            Discard
          </Forms.Button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  location: state.location,
});

const mapDispatchToProps = {
  updateLocation,
};

export default connect(mapStateToProps, mapDispatchToProps)(PanelEditor);
