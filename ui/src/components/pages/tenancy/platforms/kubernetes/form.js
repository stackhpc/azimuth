import React, { useEffect, useState } from 'react';

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import InputGroup from 'react-bootstrap/InputGroup';
import BSForm from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBan,
    faEdit,
    faExclamationTriangle,
    faPlus,
    faSave
} from '@fortawesome/free-solid-svg-icons';

import Cookies from 'js-cookie';

import { Error, Form, Field, withCustomValidity } from '../../../../utils';

import {
    ExternalIpSelectControl,
    KubernetesClusterTemplateSelectControl,
    MachineSizeLink,
    SizeSelectControl
} from '../../resource-utils';

import { PlatformSchedulingModal } from '../scheduling';


const InputWithCustomValidity = withCustomValidity("input");


const CollapsibleCard = ({ children, show, toggle, title, className, ...props }) => (
    <Card
        className={className ? `${className} collapsible-card` : "collapsible-card"}
        {...props}
    >
        <Card.Header onClick={toggle} className={show ? "toggle-show" : "toggle-hide"}>
            {title}
        </Card.Header>
        {/* The nested div is important for a smooth transition */}
        <Collapse in={show}><div>{children}</div></Collapse>
    </Card>
);


const NodeGroupModalForm = ({
    nodeGroupNames,
    nodeGroup,
    onSubmit,
    onCancel,
    sizes,
    sizeActions,
    ...props
}) => {
    const [state, setState] = useState({});
    useEffect(() => { setState(nodeGroup || {}); }, [nodeGroup]);

    const getStateKey = key => state[key] || '';
    const setStateKey = key => value => setState(state => ({ ...state, [key]: value }));
    const setStateKeyFromInputEvent = key => evt => setStateKey(key)(evt.target.value);
    const setAutoscaleFromCheckboxEvent = evt => {
        const checked = evt.target.checked;
        setState(state => ({
            ...state,
            autoscale: checked,
            count: checked ? null : state.count,
            min_count: checked ? state.min_count : null,
            max_count: checked ? state.max_count : null
        }));
    };

    const handleCancel = () => {
        setState({});
        onCancel();
    };

    const handleSubmit = (evt) => {
        evt.preventDefault();
        setState({});
        onSubmit(state);
    };

    const nameInUseMessage = (
        nodeGroupNames.some(name => name === getStateKey('name')) ?
            'Name is already in use for another node group.' :
            ''
    );

    const autoscale = getStateKey('autoscale');
    const minCount = getStateKey('min_count');
    const maxCount = getStateKey('max_count');
    const maxNodeCountMessage = (
        autoscale && minCount && maxCount && parseInt(maxCount) < parseInt(minCount) ?
            'Must be greater than or equal to the minimum count.' :
            ''
    );

    return (
        <Modal backdrop="static" onHide={handleCancel} size="lg" {...props}>
            <Modal.Header closeButton>
                <Modal.Title>{nodeGroup ? 'Edit' : 'Add'} node group</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    <Field
                        name="name"
                        label="Name"
                        helpText="Must contain lower-case alphanumeric characters and dash (-) only."
                    >
                        <BSForm.Control
                            as={InputWithCustomValidity}
                            type="text"
                            placeholder="Name"
                            required
                            pattern="^[a-z][a-z0-9\-]+[a-z0-9]$"
                            autoComplete="off"
                            value={getStateKey('name')}
                            onChange={setStateKeyFromInputEvent('name')}
                            validationMessage={nameInUseMessage}
                            autoFocus
                        />
                    </Field>
                    <Field
                        name="machine_size"
                        label="Node size"
                        helpText="The size to use for nodes in the group."
                    >
                        <SizeSelectControl
                            resource={sizes}
                            resourceActions={sizeActions}
                            // Kubernetes can only use sizes with at least 2 CPUs and 20GB disk
                            resourceFilter={size => size.cpus >= 2 && size.disk >= 20}
                            required
                            value={getStateKey('machine_size')}
                            onChange={setStateKey('machine_size')}
                        />
                    </Field>
                    <Field
                        name="autoscale"
                        helpText={
                            "Allows the number of nodes in the group to scale between a maximum " +
                            "and a minimum number based on workload."
                        }
                    >
                        <BSForm.Check
                            label="Enable autoscaling for this node group?"
                            checked={getStateKey('autoscale')}
                            onChange={setAutoscaleFromCheckboxEvent}
                        />
                    </Field>
                    {getStateKey('autoscale') ? (
                        <Row xs="1" md="2">
                            <Field
                                as={Col}
                                name="min_count"
                                label="Minimum node count"
                                helpText="The minimum number of nodes in the group."
                            >
                                <BSForm.Control
                                    placeholder="Minimum node count"
                                    type="number"
                                    required
                                    min="1"
                                    step="1"
                                    value={getStateKey('min_count')}
                                    onChange={setStateKeyFromInputEvent('min_count')}
                                />
                            </Field>
                            <Field
                                as={Col}
                                name="max_count"
                                label="Maximum node count"
                                helpText="The maximum number of nodes in the group."
                            >
                                <BSForm.Control
                                    as={InputWithCustomValidity}
                                    placeholder="Maximum node count"
                                    type="number"
                                    required
                                    min="1"
                                    step="1"
                                    value={getStateKey('max_count')}
                                    onChange={setStateKeyFromInputEvent('max_count')}
                                    validationMessage={maxNodeCountMessage}
                                />
                            </Field>
                        </Row>
                    ) : (
                        <Field
                            name="count"
                            label="Node count"
                            helpText="The target number of nodes in the group."
                        >
                            <BSForm.Control
                                placeholder="Node count"
                                type="number"
                                required
                                min="0"
                                step="1"
                                value={getStateKey('count')}
                                onChange={setStateKeyFromInputEvent('count')}
                            />
                        </Field>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" type="submit">
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save node group
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};


const initialState = kubernetesCluster => {
    if( kubernetesCluster ) {
        return {
            name: kubernetesCluster.name,
            template: kubernetesCluster.template.id,
            control_plane_size: kubernetesCluster.control_plane_size ? kubernetesCluster.control_plane_size.id : "",
            node_groups: kubernetesCluster.node_groups.map(ng => ({
                name: ng.name,
                machine_size: ng.machine_size ? ng.machine_size.id : "",
                autoscale: ng.autoscale,
                count: ng.count,
                min_count: ng.min_count,
                max_count: ng.max_count
            })),
            autohealing_enabled: kubernetesCluster.autohealing_enabled,
            dashboard_enabled: kubernetesCluster.dashboard_enabled,
            ingress_enabled: kubernetesCluster.ingress_enabled,
            ingress_controller_load_balancer_ip: kubernetesCluster.ingress_controller_load_balancer_ip,
            monitoring_enabled: kubernetesCluster.monitoring_enabled,
            monitoring_metrics_volume_size: kubernetesCluster.monitoring_metrics_volume_size,
            monitoring_logs_volume_size: kubernetesCluster.monitoring_logs_volume_size
        };
    }
    else {
        // There is no existing cluster, so set some defaults
        return {
            name: '',
            template: '',
            control_plane_size: '',
            node_groups: [],
            autohealing_enabled: true,
            dashboard_enabled: true,
            ingress_enabled: false,
            ingress_controller_load_balancer_ip: null,
            monitoring_enabled: true,
            monitoring_metrics_volume_size: 10,
            monitoring_logs_volume_size: 10
        };
    }
};


export const useKubernetesClusterFormState = kubernetesCluster => {
    // This holds the actual form data
    const [data, setData] = useState(initialState(kubernetesCluster));
    // This holds the index of the node group currently being edited
    const [nodeGroupEditIdx, setNodeGroupEditIdx] = useState(-1);
    // The indicates whether the worker count message should currently be visible
    const [showWorkerCountMessage, setShowWorkerCountMessage] = useState(false);
    // Indicates whether the addons panel should be open
    const [showAddons, setShowAddons] = useState(true);
    // Indicates whether the advanced options panel should be open
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const toggleShowAddons = () => setShowAddons(!showAddons);
    const toggleShowAdvancedOptions = () => setShowAdvancedOptions(!showAdvancedOptions);

    return [
        {
            kubernetesCluster,
            isEdit: !!kubernetesCluster,
            data,
            setData,
            nodeGroupEditIdx,
            setNodeGroupEditIdx,
            showWorkerCountMessage,
            setShowWorkerCountMessage,
            showAddons,
            toggleShowAddons,
            showAdvancedOptions,
            toggleShowAdvancedOptions
        },
        () => {
            setData(initialState(kubernetesCluster));
            setNodeGroupEditIdx(-1);
            setShowWorkerCountMessage(false);
            setShowAddons(true);
            setShowAdvancedOptions(false);
        }
    ];
};


const VolumeSizeControl = ({ isInvalid, ...props }) => (
    <InputGroup className={isInvalid ? "is-invalid" : undefined}>
        <BSForm.Control
            isInvalid={isInvalid}
            type="number"
            min="1"
            step="1"
            {...props}
        />
        <InputGroup.Text>GB</InputGroup.Text>
    </InputGroup>
);


const useSchedulingData = (tenancyId, formState) => {
    const [state, setState] = useState({
        loading: true,
        fits: false,
        quotas: null,
        error: null
    });

    const setData = (fits, data) => setState({
        loading: false,
        fits,
        quotas: data.quotas,
        error: null
    });
    const setError = error => setState({
        loading: false,
        fits: false,
        quotas: null,
        error
    });

    useEffect(
        () => {
            const fetchData = async () => {
                const headers = { 'Content-Type': 'application/json' };
                const csrfToken = Cookies.get('csrftoken');
                if( csrfToken ) headers['X-CSRFToken'] = csrfToken;
                const clusterId = formState.kubernetesCluster?.id;
                const url = clusterId ?
                    `/api/tenancies/${tenancyId}/kubernetes_clusters/${clusterId}/_schedule/` :
                    `/api/tenancies/${tenancyId}/kubernetes_clusters/_schedule/`;
                // When querying for an update, don't include the template
                const { name, template, ...data } = formState.data;
                const requestData = clusterId ? data : formState.data;
                const response = await fetch(
                    url,
                    {
                        method: "POST",
                        headers,
                        credentials: "same-origin",
                        body: JSON.stringify(requestData)
                    }
                );
                if( response.ok || response.status === 409 ) {
                    const data = await response.json();
                    setData(response.ok, data);
                }
                else {
                    setError(new Error("HTTP request failed"));
                }
            };
            fetchData().catch(setError);
        },
        []
    );
    return state;
};


export const KubernetesClusterForm = ({
    formState,
    onSubmit,
    kubernetesClusterTemplates,
    kubernetesClusterTemplateActions,
    sizes,
    sizeActions,
    externalIps,
    externalIpActions,
    tenancy,
    capabilities,
    ...props
}) => {
    const [showScheduling, setShowScheduling] = useState(false);

    const getStateKey = key => formState.data[key] || '';
    const setStateKey = key => value => formState.setData(state => ({ ...state, [key]: value }));
    const setStateKeyFromInputEvent = key => evt => setStateKey(key)(evt.target.value);
    const setStateFromCheckboxEvent = key => evt => setStateKey(key)(evt.target.checked);
    const setIngressEnabled = evt => formState.setData(state => {
        if( evt.target.checked ) {
            return {
                ...state,
                ingress_enabled: true,
                // When ingress moves to enabled, restore the previous IP if there is one
                ingress_controller_load_balancer_ip: (
                    formState.kubernetesCluster?.ingress_controller_load_balancer_ip ||
                    null
                )
            };
        }
        else {
            return {
                ...state,
                ingress_enabled: false,
                // When ingress is disabled, make sure the IP is set to null
                ingress_controller_load_balancer_ip: null
            };
        }
    });

    const cancelNodeGroupEdit = () => formState.setNodeGroupEditIdx(-1);
    const handleNodeGroupEdit = ngState => {
        const idx = formState.nodeGroupEditIdx;
        formState.setNodeGroupEditIdx(-1);
        formState.setData(data => ({
            ...data,
            node_groups: [
                ...data.node_groups.slice(0, idx),
                ngState,
                ...data.node_groups.slice(idx + 1)
            ]
        }));
    };
    const removeNodeGroup = idx => () => formState.setData(data => ({
        ...data,
        node_groups: [
            ...data.node_groups.slice(0, idx),
            ...data.node_groups.slice(idx + 1)
        ]
    }));

    const workerCount = formState.data.node_groups
        .map(ng => parseInt(ng.autoscale ? ng.min_count : ng.count))
        .reduce((a, b) => a + b, 0);
    const workerCountMessage = workerCount < 1 ? 'At least one worker node is required.' : '';
    const workerCountOnInvalid = () => formState.setShowWorkerCountMessage(true);

    const handleSubmit = (evt) => {
        evt.preventDefault();
        setShowScheduling(true);
    };
    const handleCancel = () => setShowScheduling(false);
    const handleConfirm = schedule => onSubmit({ ...formState.data, schedule });

    return (
        <>
            <Form
                {...props}
                disabled={!kubernetesClusterTemplates.initialised || !sizes.initialised}
                onSubmit={handleSubmit}
            >
                <Field
                    name="name"
                    label="Cluster name"
                    helpText="Must contain lower-case alphanumeric characters and dash (-) only."
                >
                    <BSForm.Control
                        type="text"
                        placeholder="Cluster name"
                        required
                        pattern="^[a-z][a-z0-9\-]+[a-z0-9]$"
                        autoComplete="off"
                        disabled={formState.isEdit}
                        value={getStateKey('name')}
                        onChange={setStateKeyFromInputEvent('name')}
                        autoFocus
                    />
                </Field>
                <Field
                    name="template"
                    label="Cluster template"
                    helpText="The template determines the Kubernetes version for the cluster."
                >
                    <KubernetesClusterTemplateSelectControl
                        kubernetesCluster={formState.kubernetesCluster}
                        resource={kubernetesClusterTemplates}
                        resourceActions={kubernetesClusterTemplateActions}
                        required
                        disabled={formState.isEdit}
                        value={getStateKey('template')}
                        onChange={setStateKey('template')}
                    />
                </Field>
                <Field
                    name="control_plane_size"
                    label="Control plane size"
                    helpText="The size to use for the Kubernetes control plane node(s)."
                >
                    <SizeSelectControl
                        resource={sizes}
                        resourceActions={sizeActions}
                        // Kubernetes can only use sizes with at least 2 CPUs and 20GB disk
                        resourceFilter={size => size.cpus >= 2 && size.disk >= 20 && size.ram >= 4096}
                        required
                        value={getStateKey('control_plane_size')}
                        onChange={setStateKey('control_plane_size')}
                    />
                </Field>
                <Card className="mb-3">
                    <Card.Header>Node groups</Card.Header>
                    {formState.showWorkerCountMessage && workerCountMessage !== '' && (
                        <Card.Body>
                            <Row xs="auto" className="justify-content-center">
                                <Col className="text-center">
                                    <Error className="mb-0" message={workerCountMessage} />
                                </Col>
                            </Row>
                        </Card.Body>
                    )}
                    <div className="table-responsive mb-0 pb-0">
                        <Table className="mb-0">
                            <thead>
                                <tr>
                                    <th className="ps-3">Name</th>
                                    <th className="text-nowrap">Node Size</th>
                                    <th className="text-nowrap">Node Count</th>
                                    <th className="pe-3" style={{ width: "1%" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formState.data.node_groups.map((ng, idx) => (
                                    <tr key={idx}>
                                        <td className="ps-3 align-middle">
                                            {ng.name}
                                        </td>
                                        <td className="align-middle">
                                            <MachineSizeLink sizes={sizes} size={ng.machine_size} />
                                        </td>
                                        <td className="align-middle">
                                            {ng.autoscale ? (
                                                ng.min_count === ng.max_count ?
                                                    ng.min_count :
                                                    `${ng.min_count} - ${ng.max_count}`
                                            ) : (
                                                ng.count
                                            )}
                                        </td>
                                        <td className="pe-3 align-middle" style={{ width: '1%' }}>
                                            <ButtonGroup>
                                                <Button
                                                    variant="primary"
                                                    title="Edit node group"
                                                    onClick={() => formState.setNodeGroupEditIdx(idx)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} fixedWidth />
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    title="Remove node group"
                                                    onClick={removeNodeGroup(idx)}
                                                    disabled={formState.data.node_groups.length < 2}
                                                >
                                                    <FontAwesomeIcon icon={faBan} fixedWidth />
                                                </Button>
                                            </ButtonGroup>
                                        </td>
                                    </tr>
                                ))}
                                {formState.data.node_groups.length === 0 && (
                                    <tr>
                                        <td className="p-3 text-muted text-center" colSpan="4">
                                            No node groups configured yet.
                                        </td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="px-3 pb-3 border-0 text-center" colSpan="4">
                                        <Button
                                            variant="success"
                                            onClick={() => formState.setNodeGroupEditIdx(formState.data.node_groups.length)}
                                            title="Add node group"
                                        >
                                            <FontAwesomeIcon
                                                icon={faPlus}
                                                className="me-2"
                                            />
                                            Add node group
                                        </Button>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Card>
                <CollapsibleCard
                    title="Cluster addons"
                    show={formState.showAddons}
                    toggle={formState.toggleShowAddons}
                    className="mb-3"
                >
                    <Card.Body className="pb-0">
                        <Field
                            name="dashboard_enabled"
                            helpText="Allows you to view and manage resources in your cluster using a web browser."
                        >
                            <BSForm.Check
                                label="Enable Kubernetes Dashboard?"
                                checked={getStateKey('dashboard_enabled')}
                                onChange={setStateFromCheckboxEvent('dashboard_enabled')}
                            />
                        </Field>
                        <Field
                            name="monitoring_enabled"
                            helpText="Enables collection of cluster metrics and web-based dashboards for visualisation."
                        >
                            <BSForm.Check
                                label="Enable cluster monitoring?"
                                checked={getStateKey('monitoring_enabled')}
                                onChange={setStateFromCheckboxEvent('monitoring_enabled')}
                            />
                        </Field>
                    </Card.Body>
                </CollapsibleCard>
                <CollapsibleCard
                    title="Advanced options"
                    show={formState.showAdvancedOptions}
                    toggle={formState.toggleShowAdvancedOptions}
                >
                    <Card.Body className="pb-0">
                        <Field
                            name="autohealing_enabled"
                            helpText="If enabled, the cluster will try to remediate unhealthy nodes automatically."
                        >
                            <BSForm.Check
                                label="Enable auto-healing?"
                                checked={getStateKey('autohealing_enabled')}
                                onChange={setStateFromCheckboxEvent('autohealing_enabled')}
                            />
                        </Field>
                        <Field
                            name="ingress_enabled"
                            helpText={
                                <>
                                    Allows the use of{" "}
                                    <a
                                        href="https://kubernetes.io/docs/concepts/services-networking/ingress/"
                                        target="_blank"
                                    >
                                        Kubernetes Ingress
                                    </a>{" "}
                                    to expose services in the cluster via a load balancer.
                                </>
                            }
                        >
                            <BSForm.Check
                                label="Enable Kubernetes Ingress?"
                                checked={getStateKey('ingress_enabled')}
                                onChange={setIngressEnabled}
                            />
                        </Field>
                        <Field
                            name="ingress_controller_load_balancer_ip"
                            label="Ingress controller external IP"
                            helpText={
                                <>
                                    The IP address that will be associated with the ingress controller.
                                    <br />
                                    Each <code>Ingress</code> resource created in your Kubernetes cluster{" "}
                                    must have a DNS record pointing to this IP address.{" "}
                                    This will <strong>not</strong> happen automatically.
                                </>
                            }
                        >
                            <ExternalIpSelectControl
                                resource={externalIps}
                                resourceActions={externalIpActions}
                                required={getStateKey('ingress_enabled')}
                                disabled={
                                    !getStateKey('ingress_enabled') ||
                                    formState.kubernetesCluster?.ingress_enabled
                                }
                                value={getStateKey('ingress_controller_load_balancer_ip')}
                                onChange={setStateKey('ingress_controller_load_balancer_ip')}
                                // Use the IP address itself as the value
                                getOptionValue={ip => ip.external_ip}
                            />
                        </Field>
                        <Field
                            name="monitoring_metrics_volume_size"
                            label="Metrics volume size"
                            helpText={
                                <>
                                    Metrics will be retained for 90 days or until this volume is full,
                                    whichever occurs first.
                                    <br />
                                    The rate at which metrics are produced depends on the cluster usage.
                                </>
                            }
                        >
                            <VolumeSizeControl
                                placeholder="Metrics volume size"
                                required={getStateKey('monitoring_enabled')}
                                disabled={!getStateKey('monitoring_enabled')}
                                // The volume cannot be smaller than the previous size
                                min={
                                    formState.kubernetesCluster?.monitoring_enabled &&
                                    formState.kubernetesCluster.monitoring_metrics_volume_size ||
                                    1
                                }
                                value={getStateKey('monitoring_metrics_volume_size')}
                                onChange={setStateKeyFromInputEvent('monitoring_metrics_volume_size')}
                            />
                        </Field>
                        <Field
                            name="monitoring_logs_volume_size"
                            label="Logs volume size"
                            helpText={
                                <>
                                    Logs are retained for 72 hours. The rate at which logs are produced
                                    depends on the cluster usage.
                                    <br />
                                    <strong className="text-warning">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                        If this volume becomes full, no new logs will be recorded and
                                        existing logs may be corrupted.
                                    </strong>
                                </>
                            }
                        >
                            <VolumeSizeControl
                                placeholder="Logs volume size"
                                required={getStateKey('monitoring_enabled')}
                                disabled={!getStateKey('monitoring_enabled')}
                                // The volume cannot be smaller than the previous size
                                min={
                                    formState.kubernetesCluster?.monitoring_enabled &&
                                    formState.kubernetesCluster.monitoring_logs_volume_size ||
                                    1
                                }
                                value={getStateKey('monitoring_logs_volume_size')}
                                onChange={setStateKeyFromInputEvent('monitoring_logs_volume_size')}
                            />
                        </Field>
                    </Card.Body>
                </CollapsibleCard>
                <InputWithCustomValidity
                    id="worker_count"
                    tabIndex={-1}
                    autoComplete="off"
                    style={{
                        opacity: 0,
                        width: "100%",
                        height: 0,
                        padding: 0,
                        border: 0,
                        margin: 0,
                        position: "absolute"
                    }}
                    value={workerCount}
                    onChange={() => {/* NOOP */}}
                    onInvalid={workerCountOnInvalid}
                    validationMessage={workerCountMessage}
                />
            </Form>
            <NodeGroupModalForm
                show={formState.nodeGroupEditIdx >= 0}
                nodeGroupNames={
                    formState.data.node_groups
                        .filter((_, i) => i !== formState.nodeGroupEditIdx)
                        .map(ng => ng.name)
                }
                nodeGroup={formState.data.node_groups[formState.nodeGroupEditIdx]}
                onSubmit={handleNodeGroupEdit}
                onCancel={cancelNodeGroupEdit}
                sizes={sizes}
                sizeActions={sizeActions}
            />
            {showScheduling && (
                <PlatformSchedulingModal
                    supportsScheduling={capabilities.supports_scheduling}
                    useSchedulingData={() => useSchedulingData(tenancy.id, formState)}
                    isEdit={formState.isEdit}
                    onCancel={handleCancel}
                    onConfirm={handleConfirm}
                />
            )}
        </>
    );
};


export const KubernetesClusterModalForm = ({
    kubernetesCluster,
    onSubmit,
    onCancel,
    kubernetesClusterTemplates,
    kubernetesClusterTemplateActions,
    sizes,
    sizeActions,
    externalIps,
    externalIpActions,
    tenancy,
    capabilities,
    show,
    ...props
}) => {
    const formId = (
        kubernetesCluster ?
            `kubernetes-update-${kubernetesCluster.id}` :
            "kubernetes-create"
    );
    const [formState, resetForm] = useKubernetesClusterFormState(kubernetesCluster);
    return (
        <Modal
            backdrop="static"
            onHide={onCancel}
            onEnter={resetForm}
            onExited={resetForm}
            size="lg"
            show={show}
            {...props}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {kubernetesCluster ?
                        `Update Kubernetes cluster ${kubernetesCluster.name}` :
                        'Create a new Kubernetes cluster'
                    }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <KubernetesClusterForm
                    id={formId}
                    formState={formState}
                    onSubmit={onSubmit}
                    kubernetesClusterTemplates={kubernetesClusterTemplates}
                    kubernetesClusterTemplateActions={kubernetesClusterTemplateActions}
                    sizes={sizes}
                    sizeActions={sizeActions}
                    externalIps={externalIps}
                    externalIpActions={externalIpActions}
                    tenancy={tenancy}
                    capabilities={capabilities}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="success" type="submit" form={formId}>
                    {kubernetesCluster ? (
                        <>
                            <FontAwesomeIcon icon={faSave} className="me-2" />
                            Update cluster
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Create cluster
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
