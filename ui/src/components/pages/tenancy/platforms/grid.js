import React, { useState } from 'react';

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { LinkContainer } from 'react-router-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faPlus } from '@fortawesome/free-solid-svg-icons';

import { bindArgsToActions, sortBy, Error } from '../../../utils';

import { ClusterCard } from './clusters';
import { KubernetesCard } from './kubernetes';
import { KubernetesAppCard } from './kubernetes_apps';
import { expiresSoon } from './utils';


const PlatformCard = ({
    platform,
    userId,
    tenancy,
    tenancyActions,
    capabilities,
    notificationActions,
    ...props
}) => {
    if( platform.kind === "cluster" ) {
        return (
            <ClusterCard
                cluster={platform.object}
                clusterTypes={tenancy.clusterTypes}
                clusterActions={bindArgsToActions(tenancyActions.cluster, platform.object.id)}
                userId={userId}
                tenancy={tenancy}
                tenancyActions={tenancyActions}
                capabilities={capabilities}
                notificationActions={notificationActions}
                {...props}
            />
        );
    }
    else if( platform.kind === "kubernetesCluster" ) {
        return (
            <KubernetesCard
                kubernetesCluster={platform.object}
                kubernetesClusterActions={bindArgsToActions(
                    tenancyActions.kubernetesCluster,
                    platform.object.id
                )}
                userId={userId}
                tenancy={tenancy}
                tenancyActions={tenancyActions}
                capabilities={capabilities}
            />
        );
    }
    else if( platform.kind === "kubernetesApp" ) {
        return (
            <KubernetesAppCard
                kubernetesApp={platform.object}
                kubernetesAppTemplates={tenancy.kubernetesAppTemplates}
                kubernetesAppActions={bindArgsToActions(
                    tenancyActions.kubernetesApp,
                    platform.object.id
                )}
                userId={userId}
                tenancy={tenancy}
                tenancyActions={tenancyActions}
                capabilities={capabilities}
            />
        );
    }
    else {
        // This should never happen!
        return <Error message="Unknown cluster kind" />;
    }
};


const sortPlatforms = platforms => sortBy(
    platforms,
    platform => [
        // Put expiring platforms first
        platform.schedule && expiresSoon(platform.schedule) ? 0 : 1,
        // Then sort by name
        platform.name,
    ]
);


export const PlatformsGrid = ({
    showCreateModal,
    creating,
    platforms,
    userId,
    tenancy,
    tenancyActions,
    capabilities,
    notificationActions
}) => {
    // We record in local storage when the info alert is dismissed so that it is persistent
    const [infoDismissed, setInfoDismissed_] = useState(
        window.localStorage.getItem("azimuth.platforms.infoDismissed")
    );
    const handleInfoDismissed = () => {
        setInfoDismissed_(true);
        window.localStorage.setItem("azimuth.platforms.infoDismissed", true);
    };

    // Partition the platforms into mine and not mine
    const [mine, notMine] = Object.values(platforms).reduce(
        ([mine, notMine], platform) => {
            if( platform.createdByUserId === userId ) {
                return [[...mine, platform], notMine];
            }
            else {
                return [mine, [...notMine, platform]];
            }
        },
        [[], []]
    );

    return (
        <>
            {!infoDismissed && (
                <Row className="justify-content-center">
                    <Col xs="auto">
                        <Alert
                            variant="info"
                            className="d-flex align-items-center"
                            dismissible
                            onClose={handleInfoDismissed}
                        >
                            <div className="me-3">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    size="lg"
                                />
                            </div>
                            <div>
                                Access to platforms is managed using the{" "}
                                <LinkContainer to={`/tenancies/${tenancy.id}/idp`}>
                                    <a>identity provider</a>
                                </LinkContainer>
                                {" "}for the tenancy.
                            </div>
                        </Alert>
                    </Col>
                </Row>
            )}
            {Object.keys(platforms).length > 0 ? (
                <>
                    {mine.length === 0 ? undefined : (
                        <Row className="g-3 mb-3">
                            {sortPlatforms(mine).map(platform => (
                                <Col key={platform.id} className="platform-card-wrapper">
                                    <PlatformCard
                                        platform={platform}
                                        userId={userId}
                                        tenancy={tenancy}
                                        tenancyActions={tenancyActions}
                                        capabilities={capabilities}
                                        notificationActions={notificationActions}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                    {notMine.length === 0 ? undefined : (
                        <Row className="g-3">
                            {sortPlatforms(notMine).map(platform => (
                                <Col key={platform.id} className="platform-card-wrapper">
                                    <PlatformCard
                                        platform={platform}
                                        userId={userId}
                                        tenancy={tenancy}
                                        tenancyActions={tenancyActions}
                                        capabilities={capabilities}
                                        notificationActions={notificationActions}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </>
            ) : (
                <Row className="justify-content-center">
                    <Col xs="auto py-5">
                        <Card className="create-platform-card">
                            <Card.Header as="h5" className="py-3">
                                Create a platform
                            </Card.Header>
                            <Card.Body>
                                <p>Create the first platform in this tenancy!</p>
                                <p className="mb-0">
                                    Platforms help you become productive faster by automating{" "}
                                    the deployment of complex software systems and making them{" "}
                                    easy to access.
                                </p>
                            </Card.Body>
                            <Card.Footer className="text-center">
                                <Button
                                    size="lg"
                                    variant="success"
                                    disabled={creating}
                                    onClick={showCreateModal}
                                >
                                    <FontAwesomeIcon
                                        icon={faPlus}
                                        className="me-2"
                                    />
                                    Create a platform
                                </Button>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
            )}
        </>
    );
};
