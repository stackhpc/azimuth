/**
 * This module contains components for the tenancy machines page.
 */

import React, { useEffect, useState } from 'react';

import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';
import { Redirect, Route, Switch, useRouteMatch, useParams } from 'react-router-dom';

import get from 'lodash/get';

import { Loading, bindArgsToActions, usePrevious } from '../../utils';

import { TenancyQuotasPanel } from './quotas';
import { TenancyMachinesPanel } from './machines';
import { TenancyVolumesPanel } from './volumes';
import { TenancyKubernetesClustersPanel } from './kubernetes-clusters';
import { TenancyPlatformsPanel } from './platforms';


const TenancyNav = ({ capabilities, url, tenancyId, selectedResource }) => {
    const [expanded, setExpanded] = useState(false);
    const previousExpanded = usePrevious(expanded);
    const nextExpanded = (
        // Once the nav has expanded once, it should stay expanded
        previousExpanded ||
        // If the cloud doesn't support platforms, show the expanded menu always
        !capabilities.supports_clusters ||
        // Show the expanded menu if the user is on an advanced tab
        ['machines', 'volumes', 'kubernetes'].includes(selectedResource)
    );
    useEffect(() => { setExpanded(nextExpanded) }, [nextExpanded]);

    return (
        <Nav as="ul" variant="tabs" activeKey={url} className="mb-3">
            {capabilities.supports_clusters && (
                <Nav.Item as="li">
                    <LinkContainer to={`/tenancies/${tenancyId}/platforms`}>
                        <Nav.Link>Platforms</Nav.Link>
                    </LinkContainer>
                </Nav.Item>
            )}
            <Nav.Item as="li">
                <LinkContainer exact to={`/tenancies/${tenancyId}/quotas`}>
                    <Nav.Link>Usage</Nav.Link>
                </LinkContainer>
            </Nav.Item>
            {nextExpanded ? (
                <>
                    <Nav.Item as="li">
                        <LinkContainer to={`/tenancies/${tenancyId}/machines`}>
                            <Nav.Link>Machines</Nav.Link>
                        </LinkContainer>
                    </Nav.Item>
                    {capabilities.supports_volumes && (
                        <Nav.Item as="li">
                            <LinkContainer to={`/tenancies/${tenancyId}/volumes`}>
                                <Nav.Link>Volumes</Nav.Link>
                            </LinkContainer>
                        </Nav.Item>
                    )}
                    {capabilities.supports_kubernetes && (
                        <Nav.Item as="li">
                            <LinkContainer to={`/tenancies/${tenancyId}/kubernetes`}>
                                <Nav.Link>Kubernetes</Nav.Link>
                            </LinkContainer>
                        </Nav.Item>
                    )}
                </>
            ) : (
                <NavDropdown title="Advanced">
                    <LinkContainer to={`/tenancies/${tenancyId}/machines`}>
                        <NavDropdown.Item>Machines</NavDropdown.Item>
                    </LinkContainer>
                    {capabilities.supports_volumes && (
                        <LinkContainer to={`/tenancies/${tenancyId}/volumes`}>
                            <NavDropdown.Item>Volumes</NavDropdown.Item>
                        </LinkContainer>
                    )}
                    {capabilities.supports_kubernetes && (
                        <LinkContainer to={`/tenancies/${tenancyId}/kubernetes`}>
                            <NavDropdown.Item>Kubernetes</NavDropdown.Item>
                        </LinkContainer>
                    )}
                </NavDropdown>
            )}
        </Nav>
    );
};


export const TenancyPage = ({
    capabilities,
    sshKey,
    tenancies: { fetching, data: tenancies, current: currentTenancy },
    tenancyActions,
    notificationActions
}) => {
    // Get the path parameters
    const { path, url } = useRouteMatch();
    const { id: matchedId, resource: matchedResource } = useParams();

    // When the tenancy matched in the path changes, initiate a switch if required
    const currentId = get(currentTenancy, 'id');
    useEffect(
        () => { if( !fetching && matchedId !== currentId ) tenancyActions.switchTo(matchedId) },
        [fetching, matchedId, currentId]
    );

    // If the tenancy does not exist, emit a notification
    useEffect(
        () => {
            if( !currentId && !fetching && !(tenancies || {}).hasOwnProperty(matchedId) )
                notificationActions.error({
                    title: 'Not Found',
                    message: `Tenancy '${matchedId}' does not exist.`
                });
        },
        [fetching, matchedId, currentId, tenancies]
    );

    // Check if a matched resource is present
    // If not, redirect to one based on the available capabilities
    if( !matchedResource ) {
        const defaultResource = capabilities.supports_clusters ? 'platforms' : 'quotas';
        return <Redirect to={`${url}/${defaultResource}`} />;
    }
    
    if( currentTenancy ) {
        // If there is a current tenancy, render the page
        const tenancyProps = {
            sshKey,
            capabilities,
            tenancy: currentTenancy,
            tenancyActions: {
                quota: bindArgsToActions(tenancyActions.quota, currentTenancy.id),
                image: bindArgsToActions(tenancyActions.image, currentTenancy.id),
                size: bindArgsToActions(tenancyActions.size, currentTenancy.id),
                externalIp: bindArgsToActions(tenancyActions.externalIp, currentTenancy.id),
                volume: bindArgsToActions(tenancyActions.volume, currentTenancy.id),
                machine: bindArgsToActions(tenancyActions.machine, currentTenancy.id),
                kubernetesClusterTemplate: bindArgsToActions(
                    tenancyActions.kubernetesClusterTemplate,
                    currentTenancy.id
                ),
                kubernetesCluster: bindArgsToActions(
                    tenancyActions.kubernetesCluster,
                    currentTenancy.id
                ),
                clusterType: bindArgsToActions(tenancyActions.clusterType, currentTenancy.id),
                cluster: bindArgsToActions(tenancyActions.cluster, currentTenancy.id)
            },
            notificationActions
        };
        return (
            <>
                <h1 className="border-bottom pb-1 mb-4">
                    <code>{currentTenancy.name}</code>
                </h1>
                <TenancyNav
                    capabilities={capabilities}
                    url={url}
                    tenancyId={currentTenancy.id}
                    selectedResource={matchedResource}
                />
                <Switch>
                    <Route exact path={`${path}/quotas`}>
                        <TenancyQuotasPanel {...tenancyProps} />
                    </Route>
                    <Route exact path={`${path}/machines`}>
                        <TenancyMachinesPanel {...tenancyProps} />
                    </Route>
                    <Route exact path={`${path}/volumes`}>
                        <TenancyVolumesPanel {...tenancyProps} />
                    </Route>
                    <Route exact path={`${path}/kubernetes`}>
                        <TenancyKubernetesClustersPanel {...tenancyProps} />
                    </Route>
                    <Route exact path={`${path}/platforms`}>
                        <TenancyPlatformsPanel {...tenancyProps} />
                    </Route>
                </Switch>
            </>
        );
    }
    else if( fetching || (tenancies || {}).hasOwnProperty(matchedId) ) {
        // If fetching tenancies or the matched id is in the tenancy data, allow more time
        return (
            <Row className="justify-content-center">
                <Col xs="auto" className="mt-5">
                    <Loading iconSize="lg" size="lg" message="Loading tenancies..." />
                </Col>
            </Row>
        );
    }
    else {
        // Otherwise redirect
        return <Redirect to="/dashboard" />;
    }
};
