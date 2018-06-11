'use babel';

import WebClipperMessageDialog from './web-clipper-message-dialog';

export function activate() {
  inkdrop.components.registerClass(WebClipperMessageDialog);
  inkdrop.layouts.addComponentToLayout('modals', 'WebClipperMessageDialog');
}
export function deactivate() {
  inkdrop.layouts.removeComponentFromLayout('modals', 'WebClipperMessageDialog');
  inkdrop.components.deleteClass(WebClipperMessageDialog);
}
