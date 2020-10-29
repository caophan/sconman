class CustomMenuExtension extends Autodesk.Viewing.Extension {
  load() {
    this.viewer.setContextMenu(new MyContextMenu(this.viewer))
    return true
  }

  unload() {
    this.viewer.setContextMenu(null)
    return true
  }
}

class MyContextMenu extends Autodesk.Viewing.UI.ObjectContextMenu {
  buildMenu(event, status) {
    const menu = []
    if (status.hasSelected) {
      menu.push({
        title: 'Mark as done',
        target: () => {
          const selSet = this.viewer.getSelection()
          this.viewer.clearSelection()
          const color = new THREE.Vector4(1, 0, 0, 1)
          // this.viewer.model.getBulkProperties(selSet, ['Length'], props => console.log(props))
          for (const dbId of selSet) {
            this.viewer.setThemingColor(dbId, color)
            this.viewer.getProperties(dbId, props => {
              console.log(props)
            });
          }

          fetch('/api/sconman/done', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(selSet),
          })
        },
      })

      if (status.hasVisible) {
        menu.push({
          title: "Hide Selected",
          target: () => {
            var selected = this.viewer.impl.selector.getAggregateSelection();
            this.viewer.impl.visibilityManager.aggregateHide(selected);
            this.viewer.clearSelection();
          }
        });
      }
    } else {
      menu.push({
        title: 'Undo',
        target: () => {
          this.viewer.clearThemingColors()
        },
      })
    }

    menu.push({
      title: "Show All Objects",
      target: () => {
        this.viewer.showAll();
      }
    });
    return menu
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  'CustomMenuExtension',
  CustomMenuExtension
)
