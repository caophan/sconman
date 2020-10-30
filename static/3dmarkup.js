class GeometryMarkupExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    load() {
        this.loadFont()
        const updateGeometryCallback = (e) => {
            if (this._enabled) {
                this.updateGeometry(e.camera);
            }
        };
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateGeometryCallback);
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }

        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('customExtensions');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('customExtensions');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('GeometryExtension');
        this._button.onClick = (ev) => {
            this._enabled = !this._enabled;
            this.showGeometry(this._enabled);
            this._button.setState(this._enabled ? 0 : 1);

        };
        this._button.setToolTip('Show Label Geometry');
        const icon = this._button.container.children[0];
        icon.classList.add('mdi', 'mdi-note');
        this._group.addControl(this._button);
    }

    getModifiedWorldBoundingBox(dbId) {
        var fragList = this.viewer.model.getFragmentList();
        const nodebBox = new THREE.Box3()

        // for each fragId on the list, get the bounding box
        for (const fragId of this._frags[dbId]) {
            const fragbBox = new THREE.Box3();
            fragList.getWorldBounds(fragId, fragbBox);
            nodebBox.union(fragbBox); // create a unifed bounding box
        }

        return nodebBox
    }

    loadFont() {
        fetch('/fonts/helvetiker_regular.typeface.json').then(response => response.json()).then(data => {
            THREE.FontUtils.loadFace(data);
        })
    }

    showGeometry(show) {
        if (this.group === undefined) {
            // do we have access to the instance tree?
            const tree = this.viewer.model.getInstanceTree();
            if (tree === undefined) { console.log('Loading tree...'); return; }

            this._frags = {}
            const dbIds = tree.nodeAccess.dbIdToIndex
            for (const nodeId in dbIds) {
                // we need to collect all the fragIds for a given dbId
                this._frags[nodeId] = []

                // now collect the fragIds
                tree.enumNodeFragments(parseInt(nodeId), (fragId) => {
                    this._frags[nodeId].push(fragId);
                });
            }

            const scene = this.viewer.impl.scene;
            this.group = new THREE.Group();
            scene.add(this.group)

            const rotation = this.viewer.getCamera().rotation

            const material = this.viewer.impl.getMaterials().defaultMaterial

            for (const nodeId in this._frags) {
                if (this._frags[nodeId].length > 0) {
                    const name = tree.getNodeName(nodeId)
            
                    let geometry = new THREE.TextGeometry(name, {
                        font: 'helvetiker',
                        weight: 'normal',
                        style: 'normal',
                        size: 5,
                        height: 1,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 1,
                        bevelSize: 1
                    });
                    geometry.computeBoundingBox();
                    // geometry.computeVertexNormals();
                    const bbox =  geometry.boundingBox

                    geometry = new THREE.BufferGeometry().fromGeometry( geometry );
            
                    const text = new THREE.Mesh(geometry, material)
                    const center = this.getModifiedWorldBoundingBox(nodeId).center();
                    text.position.x = center.x + 0.5 * (bbox.max.y - bbox.min.y);
                    text.position.y = center.y - 0.5 * (bbox.max.x - bbox.min.x);
                    text.position.z = center.z;
                    text.rotation.set(rotation.x, rotation.y, rotation.z);
                    this.group.add(text);
                }
            }
        } else {
            if (show) {
                this.viewer.impl.scene.add(this.group)
                this.updateGeometry(this.viewer.getCamera())
            } else {
                this.viewer.impl.scene.remove(this.group)
            }
        }

        this.viewer.impl.sceneUpdated(true);
    }

    updateGeometry(camera) {
        const rotation = camera.rotation
        this.group.children.forEach(text => {
            text.rotation.set(rotation.x, rotation.y, rotation.z)
        })
    }
}
Autodesk.Viewing.theExtensionManager.registerExtension('GeometryMarkupExtension', GeometryMarkupExtension);