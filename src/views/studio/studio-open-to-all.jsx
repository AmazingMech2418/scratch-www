/* eslint-disable react/jsx-no-bind */
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';

import {selectStudioOpenToAll, selectIsFetchingInfo} from '../../redux/studio';
import {
    mutateStudioOpenToAll, selectIsMutatingOpenToAll, selectOpenToAllMutationError
} from '../../redux/studio-mutations';

import ToggleSlider from '../../components/forms/toggle-slider.jsx';

const StudioOpenToAll = ({
    openToAllError, isFetching, isMutating, openToAll, handleUpdate
}) => (
    <div>
        {isFetching ? (
            <h4>Fetching...</h4>
        ) : (
            <div>
                <FormattedMessage id="studio.openToAll" />
                <ToggleSlider
                    disabled={isMutating}
                    checked={openToAll}
                    className={classNames('open-to-all-input', {
                        'mod-mutating': isMutating
                    })}
                    onChange={e => handleUpdate(e.target.checked)}
                />
                {openToAllError && <div>Error mutating openToAll: {openToAllError}</div>}
            </div>
        )}
    </div>
);

StudioOpenToAll.propTypes = {
    openToAllError: PropTypes.string,
    isFetching: PropTypes.bool,
    isMutating: PropTypes.bool,
    openToAll: PropTypes.bool,
    handleUpdate: PropTypes.func
};

export default connect(
    state => ({
        openToAll: selectStudioOpenToAll(state),
        isFetching: selectIsFetchingInfo(state),
        isMutating: selectIsMutatingOpenToAll(state),
        openToAllError: selectOpenToAllMutationError(state)
    }),
    {
        handleUpdate: mutateStudioOpenToAll
    }
)(StudioOpenToAll);
