// Core logic for LiveEdit
let editModeActive = false;
let hudElement = null;
let hudDismissed = false; // Tracks if the user intentionally hid the HUD

// Listen for toggle command from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TOGGLE_EDIT_MODE") {
    toggleEditMode();
    sendResponse({ status: "success" });
  }
});

function toggleEditMode() {
  editModeActive = !editModeActive;
  
  if (editModeActive) {
    document.designMode = "on";
    document.body.classList.add('jbuilds-edit-active');
    hudDismissed = false; // Reset HUD state on a fresh toggle
    showHUD();
    
    document.addEventListener('click', handleAdvancedEdits, true);
    document.addEventListener('keydown', handleHotkeys, true);
  } else {
    document.designMode = "off";
    document.body.classList.remove('jbuilds-edit-active');
    hideHUD();
    
    document.removeEventListener('click', handleAdvancedEdits, true);
    document.removeEventListener('keydown', handleHotkeys, true);
  }
}

function handleHotkeys(e) {
  // Press Escape to quickly hide the HUD while keeping Edit Mode ON
  if (e.key === "Escape" && editModeActive && !hudDismissed) {
    dismissHUD();
  }
}

// Handle Alt+Click (Swap) and Shift+Click (Delete)
function handleAdvancedEdits(e) {
  if (!editModeActive) return;

  // Image Swapper (Alt + Click)
  if (e.altKey) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.tagName === 'IMG') {
      const currentSrc = e.target.src;
      const newSrc = prompt("JBuilds LiveEdit\n\nEnter new Image URL:", currentSrc);
      if (newSrc) {
        e.target.src = newSrc;
        e.target.srcset = ""; 
      }
    } else {
      alert("Element is not an image. Alt+Click is reserved for Image Swapping.");
    }
  }

  // Element Killer (Shift + Click)
  if (e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't delete our own HUD
    if (e.target.closest('#jbuilds-liveedit-hud')) return;
    
    e.target.remove();
  }
}

// UI: Create and manage the Heads Up Display (HUD)
function showHUD() {
  if (hudDismissed) return;

  if (!hudElement) {
    hudElement = document.createElement('div');
    hudElement.id = 'jbuilds-liveedit-hud';
    hudElement.contentEditable = "false"; // Prevent the HUD itself from being edited
    
    hudElement.innerHTML = `
      <div class="jb-hud-header">
        <div class="jb-hud-title">🌐LiveEdit <span>ON</span></div>
        <div class="jb-hud-close" title="Dismiss (Esc)">&times;</div>
      </div>
      <div class="jb-hud-body">
        <p><strong>Click</strong> to edit any text.</p>
        <p><strong>Alt + Click</strong> on image to swap URL.</p>
        <p><strong>Shift + Click</strong> on element to delete.</p>
      </div>
    `;
    document.body.appendChild(hudElement);

    // FIX: Use 'mousedown' instead of 'click' and kill the event propagation 
    // before designMode can hijack it to place a text cursor.
    hudElement.querySelector('.jb-hud-close').addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissHUD();
    });
  }
  
  hudElement.style.display = 'block';
  // Force reflow for CSS transition
  void hudElement.offsetWidth;
  hudElement.classList.add('jb-visible');
}

function hideHUD() {
  if (hudElement) {
    hudElement.classList.remove('jb-visible');
    // Wait for the fade out animation before hiding
    setTimeout(() => {
      if (hudElement && !hudElement.classList.contains('jb-visible')) {
        hudElement.style.display = 'none';
      }
    }, 300);
  }
}

function dismissHUD() {
  hudDismissed = true;
  hideHUD();
}