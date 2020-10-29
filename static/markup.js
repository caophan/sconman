class MarkupExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    load() {
        const updateIconsCallback = () => {
            if (this._enabled) {
                this.updateIcons();
            }
        };
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateIconsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateIconsCallback);
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
        this._button = new Autodesk.Viewing.UI.Button('IconExtension');
        this._button.onClick = (ev) => {
            this._enabled = !this._enabled;
            this.showIcons(this._enabled);
            this._button.setState(this._enabled ? 0 : 1);

        };
        this._button.setToolTip('Show Label');
        const icon = this._button.container.children[0];
        icon.classList.add('mdi', 'mdi-note-text');
        this._group.addControl(this._button);
    }

    showIcons(show) {
        const $viewer = document.querySelector('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer');

        // remove previous...
        const list = document.querySelectorAll('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer label.markup');
        list.forEach(item => item.remove());
        if (!show) return;

        // do we have access to the instance tree?
        const tree = this.viewer.model.getInstanceTree();
        if (tree === undefined) { console.log('Loading tree...'); return; }

        const onClick = (e) => {
            const id = e.target.dataset.id
            this.viewer.fitToView([id])
        };

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

        for (const nodeId in this._frags) {
            if (this._frags[nodeId].length > 0) {
                // create the label for the dbId
                let $label = document.createElement('label');
                $label.classList.add('markup', 'update')
                $label.dataset.id = nodeId

                $label.style.position = 'inherit';
                $label.onclick = onClick;

                const name = tree.getNodeName(nodeId)
                let text = document.createTextNode(name);

                $label.appendChild(text);
                $viewer.append($label);
            }
        }
        this.updateIcons();
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

    getFragmentWorldMatrixByNodeId(dbId) {
        // for each fragId on the list, get the bounding box
        const fragId = this._frags[dbId][0]

        let fragProxy = this.viewer.impl.getFragmentProxy(this.viewer.model, fragId);
        let matrix = new THREE.Matrix4();
        fragProxy.getWorldMatrix(matrix);
        const pos = new THREE.Vector3();
        return pos.setFromMatrixPosition(matrix)
    }

    updateIcons() {
        const list = document.querySelectorAll('#' + this.viewer.clientContainer.id + ' div.adsk-viewing-viewer .update')
        const $vm = this
        list.forEach(function($label) {
            const dbId = $label.dataset.id;

            // get the center of the dbId (based on its fragIds bounding boxes)
            const center = $vm.getModifiedWorldBoundingBox(dbId).center();
            // const center = $vm.getFragmentWorldMatrixByNodeId(dbId);
            const pos = $vm.viewer.worldToClient(center);

            // position the label center to it
            const left = Math.floor(pos.x - $label.offsetWidth / 2);
            const top = Math.floor(pos.y - $label.offsetHeight / 2);
            const display = $vm.viewer.isNodeVisible(dbId) ? 'block' : 'none';

            $label.style.display = display;
            $label.style.left = `${left}px`;
            $label.style.top = `${top}px`;
        })
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('MarkupExtension', MarkupExtension);