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
          for (let i = 0; i < selSet.length; i++) {
            this.viewer.setThemingColor(selSet[i], color)
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
    } else {
      menu.push({
        title: 'Undo',
        target: () => {
          this.viewer.clearThemingColors()
        },
      })
    }
    return menu
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
  'CustomMenuExtension',
  CustomMenuExtension
)
