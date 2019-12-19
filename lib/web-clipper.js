'use babel'

import WebClipperMessageDialog from './web-clipper-message-dialog'

module.exports = {
  activate() {
    inkdrop.components.registerClass(WebClipperMessageDialog)
    inkdrop.layouts.addComponentToLayout('modal', 'WebClipperMessageDialog')
  },

  deactivate() {
    inkdrop.layouts.removeComponentFromLayout(
      'modal',
      'WebClipperMessageDialog'
    )
    inkdrop.components.deleteClass(WebClipperMessageDialog)
  }
}
