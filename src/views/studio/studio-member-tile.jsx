/* eslint-disable react/jsx-no-bind */
import React, {useState, useRef, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';

import PromoteModal from './modals/promote-modal.jsx';
import ManagerLimitModal from './modals/manager-limit-modal.jsx';

import {
    selectCanRemoveCurator, selectCanRemoveManager, selectCanPromoteCurators
} from '../../redux/studio-permissions';
import {
    Errors,
    promoteCurator,
    removeCurator,
    removeManager
} from './lib/studio-member-actions';

import {selectStudioHasReachedManagerLimit} from '../../redux/studio';
import {useAlertContext} from '../../components/alert/alert-context';

import OverflowMenu from '../../components/overflow-menu/overflow-menu.jsx';
import removeIcon from './icons/remove-icon.svg';
import promoteIcon from './icons/curator-icon.svg';

function useAnimation() {
  const animationRef = useRef();
  const xRef = useRef();
  const yRef = useRef();
  const widthRef = useRef();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [width, setWidth] = useState(0);
  const [animating, setAnimating] = useState(false);

  const stateRefs = useRef();
  stateRefs.current = {x, y};

  useEffect(() => {
      xRef.current = animationRef.current.offsetLeft;
      yRef.current = animationRef.current.offsetTop;
      widthRef.current = animationRef.current.offsetWidth - 20;
      window.addEventListener("resize", () => {
          xRef.current = animationRef.current.offsetLeft;
          yRef.current = animationRef.current.offsetTop;
          widthRef.current = animationRef.current.offsetWidth - 20;
      });
  })


  const animate = () => {
    const to = {x: 0, y: 97};
    const dx = to.x - xRef.current;
    const dy = to.y - yRef.current;

    setX(xRef.current);
    setY(yRef.current);
    setWidth(widthRef.current)
    setAnimating(true);

    let i = 0;
    const interval = setInterval(() => {
        const {x, y} = stateRefs.current;
      setX(x + dx/100);
      setY(y + dy/100);
        if(i > 100) {
          clearInterval(interval);
          setAnimating(false);
        }
        i++
    }, 10);
  }

  return {animationRef, pos: {x, y, width}, animating, animate};
}


const StudioMemberTile = ({
    canRemove, canPromote, onRemove, onPromote, isCreator, hasReachedManagerLimit, // mapState props
    username, image // own props
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [managerLimitReached, setManagerLimitReached] = useState(false);
    const {errorAlert, successAlert} = useAlertContext();

    const {animationRef, pos, animating, animate} = useAnimation();

    const style = {};
    const placeholderStyle = {};
    if(animating) {
      style.position = "absolute";
      style.zIndex = "999";
      style.left = pos.x;
      style.top = pos.y;
      style.width = pos.width;
    } else {
      placeholderStyle.display = "none";
    }

    const userUrl = `/users/${username}`;
    return (
      <div>
        <div className="studio-member-tile placeholder" style={placeholderStyle}>
          <a href={userUrl}>
              <img
                  className="studio-member-image"
                  src={image}
              />
          </a>
          <div className="studio-member-info">
              <a
                  href={userUrl}
                  className="studio-member-name"
              >{username}</a>
              {isCreator && <div className="studio-member-role"><FormattedMessage id="studio.creatorRole" /></div>}
          </div>
        </div>
        <div className="studio-member-tile"
          ref={animationRef}
          style={style}
        >
            <a href={userUrl}>
                <img
                    className="studio-member-image"
                    src={image}
                />
            </a>
            <div className="studio-member-info">
                <a
                    href={userUrl}
                    className="studio-member-name"
                >{username}</a>
                {isCreator && <div className="studio-member-role"><FormattedMessage id="studio.creatorRole" /></div>}
            </div>
            {(canRemove || canPromote) &&
                <OverflowMenu closeMenu={animating}>
                    {true && <li>
                        <button
                            onClick={() => {
                                animate();
                            }}
                        >
                            <img src={promoteIcon} />
                            <FormattedMessage id="studio.demote" />
                        </button>
                    </li>}
                    {canPromote && <li>
                        <button
                            onClick={() => {
                                setModalOpen(true);
                            }}
                        >
                            <img src={promoteIcon} />
                            <FormattedMessage id="studio.promote" />
                        </button>
                    </li>}
                    {canRemove && <li>
                        <button
                            className={classNames({
                                'mod-mutating': submitting
                            })}
                            disabled={submitting}
                            onClick={() => {
                                setSubmitting(true);
                                onRemove(username).catch(() => {
                                    errorAlert({
                                        id: 'studio.alertMemberRemoveError',
                                        values: {name: username}
                                    }, null);
                                    setSubmitting(false);
                                });
                            }}
                        >
                            <img src={removeIcon} />
                            <FormattedMessage id="studio.remove" />
                        </button>
                    </li>}
                </OverflowMenu>
            }
            {modalOpen &&
                ((hasReachedManagerLimit || managerLimitReached) ?
                    <ManagerLimitModal
                        handleClose={() => setModalOpen(false)}
                    /> :
                    <PromoteModal
                        handleClose={() => setModalOpen(false)}
                        handlePromote={() => {
                            onPromote(username)
                                .then(() => {
                                    successAlert({
                                        id: 'studio.alertManagerPromote',
                                        values: {name: username}
                                    });
                                })
                                .catch(error => {
                                    if (error === Errors.MANAGER_LIMIT) {
                                        setManagerLimitReached(true);
                                        setModalOpen(true);
                                    } else {
                                        errorAlert({
                                            id: 'studio.alertManagerPromoteError',
                                            values: {name: username}
                                        });
                                    }
                                });
                        }}
                        username={username}
                    />
                )
            }
        </div>
        </div>
    );
};

StudioMemberTile.propTypes = {
    canRemove: PropTypes.bool,
    canPromote: PropTypes.bool,
    onRemove: PropTypes.func,
    onPromote: PropTypes.func,
    username: PropTypes.string,
    image: PropTypes.string,
    isCreator: PropTypes.bool,
    hasReachedManagerLimit: PropTypes.bool
};

const ManagerTile = connect(
    (state, ownProps) => ({
        canRemove: true, //selectCanRemoveManager(state, ownProps.id),
        canPromote: false,
        isCreator: state.studio.owner === ownProps.id
    }),
    {
        onRemove: removeManager
    }
)(StudioMemberTile);

const CuratorTile = connect(
    (state, ownProps) => ({
        canRemove: selectCanRemoveCurator(state, ownProps.username),
        canPromote: selectCanPromoteCurators(state),
        hasReachedManagerLimit: selectStudioHasReachedManagerLimit(state)
    }),
    {
        onRemove: removeCurator,
        onPromote: promoteCurator
    }
)(StudioMemberTile);

export {
    ManagerTile,
    CuratorTile
};
