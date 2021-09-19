// Menu
//

function Menu_Visible() {
  'use strict';

  var result;

  result = Browser.ContainsClass(this.connect.presentation_div.className, 'menu_open');

  return result;
}

function Menu_Show() {
  'use strict';

  var presentation_div;

  presentation_div = Connect.presentation_div;

  presentation_div.className = Browser.RemoveClass(presentation_div.className, 'menu_initial');
  presentation_div.className = Browser.RemoveClass(presentation_div.className, 'menu_closed');
  presentation_div.className = Browser.AddClass(presentation_div.className, 'menu_open');

  setTimeout(function () {
    Connect.OnResize();
  }, 300);
}

function Menu_Hide() {
  'use strict';

  var presentation_div;

  presentation_div = Connect.presentation_div;

  presentation_div.className = Browser.RemoveClass(presentation_div.className, 'menu_initial');
  presentation_div.className = Browser.RemoveClass(presentation_div.className, 'menu_open');
  presentation_div.className = Browser.AddClass(presentation_div.className, 'menu_closed');

  setTimeout(function () {
    Connect.OnResize();
  }, 300);
}

function Menu_Display(param_setup, param_teardown) {
  'use strict';

  var this_menu;

  // Setup
  //
  param_setup(this.window, this.menu_content);

  // Configure teardown
  //
  this.teardown = param_teardown;
};

function Menu_Enabled() {
  'use strict';
  var menu_enabled;

  menu_enabled = Connect_Window.document.getElementById('menu_content') !== null;

  return menu_enabled;
};

function Menu_CalculateMenuSize() {
  'use strict';
  var container_div, content_div, header_height, toolbar_height,
      page_height, page_scroll_height, page_scroll_top,
      viewport_height, visible_height,
      footer_height, footer_y_position, calculated_height,
      padding_offset_top, padding_offset_bottom,
      border_offset_top, border_offset_bottom,
      toc_border_top_offset, toc_border_bottom_offset;
      toc_border_top_offset, toc_border_bottom_offset;

  calculated_height = 0;

  // Load dem variables
  //
  container_div = Connect.container_div;
  content_div = Connect.SearchEnabled() ? Connect.search_div : Connect.page_div;

  header_height = parseFloat(window.getComputedStyle(Connect.header_div, null)["height"]);
  toolbar_height = parseFloat(window.getComputedStyle(Connect.toolbar_div, null)["height"]);
  page_height = parseFloat(window.getComputedStyle(content_div, null)["height"]);
  page_scroll_height = parseFloat(container_div.scrollHeight);
  page_scroll_top = parseFloat(container_div.scrollTop);
  viewport_height = parseFloat(window.innerHeight);
  visible_height = viewport_height - header_height - toolbar_height;
  footer_height = parseFloat(window.getComputedStyle(Connect.footer_div, null)["height"]);
  footer_y_position = page_scroll_height - page_scroll_top - footer_height;

  // Get possible flow-breaking offsets to subtract from menu final height
  //
  padding_offset_top = parseFloat(window.getComputedStyle(Connect.menu_frame_div, null)["padding-top"]);
  padding_offset_bottom = parseFloat(window.getComputedStyle(Connect.menu_frame_div, null)["padding-bottom"]);
  border_offset_top = parseFloat(window.getComputedStyle(Connect.menu_frame_div, null)["border-top"]);
  border_offset_bottom = parseFloat(window.getComputedStyle(Connect.menu_frame_div, null)["border-bottom"]);
  toc_border_top_offset = parseFloat(window.getComputedStyle(Connect.toc_div, null)["border-top"]);
  toc_border_bottom_offset = parseFloat(window.getComputedStyle(Connect.toc_div, null)["border-bottom"]);

  // Cast NaN to 0 for IE parseFloat values
  //
  padding_offset_top = isNaN(padding_offset_top) ? 0 : padding_offset_top;
  padding_offset_bottom = isNaN(padding_offset_bottom) ? 0 : padding_offset_bottom;
  border_offset_top = isNaN(border_offset_top) ? 0 : border_offset_top;
  border_offset_bottom = isNaN(border_offset_bottom) ? 0 : border_offset_bottom;
  toc_border_bottom_offset = isNaN(toc_border_bottom_offset) ? 0 : toc_border_bottom_offset;

  if (Browser.ContainsClass(Connect.layout_div.className, 'layout_narrow')) {
    // Menu is the view height in .layout_narrow
    //
    calculated_height = visible_height;
  } else {
    if (!Connect.footer_end_of_layout) {
      // Footer is in Page. Menu is always the size of the view.
      //
      calculated_height = visible_height;
    }
    else {
      if (footer_y_position >= visible_height) {
        // Footer is offscreen, menu is as tall as the visible area
        //
        calculated_height = visible_height;
      } else if (footer_y_position < visible_height) {
        // Footer is onscreen
        //
        calculated_height = page_height - page_scroll_top;
      }
    }

    calculated_height = calculated_height - padding_offset_top - padding_offset_bottom - border_offset_top - border_offset_bottom;
  }

  calculated_height = calculated_height - toc_border_bottom_offset;

  // Do the stuff
  //
  this.ResizeMenu(calculated_height);
};

function Menu_ResizeMenu(height) {
  'use strict';
  var menu_element, nav_buttons_element,
      menu_height, nav_buttons_height;

  // Get the outer menu element and nav buttons container
  //
  menu_element = document.getElementById("menu_frame");
  nav_buttons_element = document.getElementById("nav_buttons_div");
  menu_height = 0
  nav_buttons_height = 0;

  // Menu exists?
  //
  if (menu_element !== null) {
    // Get the current height of the menu
    //
    menu_height = parseFloat(window.getComputedStyle(menu_element, null)["height"]);

    var content_height;
    // Update the height of the outer menu
    //
    menu_element.style["height"] = height + "px";
    menu_height = height;

    // Does the nav buttons container exist?
    //
    if (nav_buttons_element !== null) {
      // Get the height of the container
      //
      nav_buttons_height = parseFloat(window.getComputedStyle(nav_buttons_element, null)["height"]);

      if (isNaN(nav_buttons_height)) {
        nav_buttons_height = 0;
      }

      // Get the difference between the total menu height and the nav buttons to figure out
      // how tall the TOC/Index needs to be
      //
      content_height = menu_height - nav_buttons_height;

      this.ResizeTOC(content_height);
      this.ResizeIndex(content_height);
    }
  }
};

function Menu_ResizeTOC(height) {
  'use strict';
  var toc_title_element, toc_content_element,
      toc_title_height, calculated_height;

  calculated_height = 0;

  toc_title_element = document.getElementById("toc_title");
  toc_content_element = document.getElementById("toc_content");

  if (toc_title_element && toc_content_element) {
    toc_title_height = parseFloat(window.getComputedStyle(toc_title_element, null)["height"]);
    toc_title_height = !isNaN(toc_title_height) ? toc_title_height : 0; // So we can do maths on it

    calculated_height = height - toc_title_height;
    toc_content_element.style["height"] = calculated_height + "px";
  }
};

function Menu_ResizeIndex(height) {
  'use strict';
  var index_title_element, index_content_element,
      index_title_height, calculated_height;

  calculated_height = 0;

  index_title_element = document.getElementById("index_title");
  index_content_element = document.getElementById("index_content");

  if (index_title_element && index_content_element) {
    index_title_height = parseFloat(window.getComputedStyle(index_title_element, null)["height"]);
    index_title_height = !isNaN(index_title_height) ? index_title_height : 0; // So we can do maths on it

    calculated_height = height - index_title_height;
    index_content_element.style["height"] = calculated_height + "px";
  }
};

function Menu_Object(param_window, param_connect) {
  'use strict';

  this.window = param_window;
  this.connect = param_connect;
  this.menu_frame = this.window.document.getElementById('menu_frame');
  this.menu_content = this.window.document.getElementById('menu_content');
  this.page_div = this.window.document.getElementById('page_div');
  this.page_iframe = this.window.document.getElementById('page_iframe');
  this.show_inprogress = false;
  this.menu_mode_visible = undefined;

  this.Enabled = Menu_Enabled();
  this.Visible = Menu_Visible;
  this.Show = Menu_Show;
  this.Hide = Menu_Hide;
  this.Display = Menu_Display;
  this.CalculateMenuSize = Menu_CalculateMenuSize;
  this.ResizeMenu = Menu_ResizeMenu;
  this.ResizeTOC = Menu_ResizeTOC;
  this.ResizeIndex = Menu_ResizeIndex;
};