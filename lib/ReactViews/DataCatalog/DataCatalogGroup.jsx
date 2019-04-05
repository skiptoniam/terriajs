import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import addedByUser from '../../Core/addedByUser';
import removeUserAddedData from '../../Models/removeUserAddedData';
import CatalogGroup from './CatalogGroup';
import DataCatalogMember from './DataCatalogMember';
import getAncestors from '../../Models/getAncestors';
import ObserveModelMixin from '../ObserveModelMixin';

const DataCatalogGroup = createReactClass({
    displayName: 'DataCatalogGroup',
    mixins: [ObserveModelMixin],

    propTypes: {
        group: PropTypes.object.isRequired,
        viewState: PropTypes.object.isRequired,
        /** Overrides whether to get the open state of the group from the group model or manage it internally */
        manageIsOpenLocally: PropTypes.bool,
        userData: PropTypes.bool,
        removable: PropTypes.bool,
        terria: PropTypes.object
    },

    getDefaultProps() {
        return {
            manageIsOpenLocally: false,
            userData: false
        };
    },

    getInitialState() {
        return {
            /** Only used if manageIsOpenLocally === true */
            isOpen: false
        };
    },

    toggleStateIsOpen() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    },

    isOpen() {
        if (this.props.manageIsOpenLocally) {
            return this.state.isOpen;
        }
        return this.props.group.isOpen;
    },

    toggleOpen() {
        if (this.props.manageIsOpenLocally) {
            this.toggleStateIsOpen();
        }
        this.props.group.toggleOpen();
    },

    clickGroup() {
        this.toggleOpen();
        this.props.viewState.viewCatalogMember(this.props.group);
    },

    isTopLevel() {
        const parent = this.props.group.parent;
        return !parent || !parent.parent;
    },

    isSelected() {
        return addedByUser(this.props.group) ?
            this.props.viewState.userDataPreviewedItem === this.props.group :
            this.props.viewState.previewedItem === this.props.group;
    },

    shouldTruncate() {
        return this.props.group.nameInCatalog && this.props.group.nameInCatalog.indexOf(' ') === -1;
    },

    render() {
        const group = this.props.group;
        return (
            <CatalogGroup
                truncate={this.shouldTruncate()}
                text={group.nameInCatalog}
                title={getAncestors(group).map(member => member.nameInCatalog).join(' → ')}
                topLevel={this.isTopLevel()}
                open={this.isOpen()}
                loading={group.isLoading}
                emptyMessage="This group is empty"
                onClick={this.clickGroup}
                removable={this.props.removable}
                removeUserAddedData ={removeUserAddedData.bind(this, this.props.terria, this.props.group)}
                selected ={this.isSelected()}>
                <If condition={this.isOpen()}>
                    <For each="item" of={group.items}>
                        <DataCatalogMember
                            key={item.uniqueId}
                            member={item}
                            viewState={this.props.viewState}
                            userData={this.props.userData}
                            overrideOpen={this.props.manageIsOpenLocally}
                        />
                    </For>
                </If>
            </CatalogGroup>
        );
    },
});

module.exports = DataCatalogGroup;
