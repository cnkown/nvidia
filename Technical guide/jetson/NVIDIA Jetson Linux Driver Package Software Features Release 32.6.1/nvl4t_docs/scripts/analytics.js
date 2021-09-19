// Copyright Quadralay Corporation 2018 - 2020
//

// IMPORTANT: global variables are modified by connect.xsl and should not be changed.
var GLOBAL_GA_TRACKING_ID = '';
var GLOBAL_GA_DEFAULT_URL = '';

var Analytics = {
  ga_tracking_id: GLOBAL_GA_TRACKING_ID,
  ga_default_url: GLOBAL_GA_DEFAULT_URL,
  event_type: '',
  event_data: {}
};

// Load gtag library
//
(function () {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://www' : 'http://www') + '.googletagmanager.com/gtag/js?id=' + Analytics.ga_tracking_id;
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// ASAP, set communication layer, send time stamp, set configuration
//
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', Analytics.ga_tracking_id, { 'send_page_view': false });

// Event router
//
// All calls can be made by populating Analytics.event_type and Analytics.event_data
// with the necessary information, and then calling this function, Analytics.CaptureEvent
//
Analytics.CaptureEvent = function () {
  'use strict';

  switch (Analytics.event_type) {
    case 'page_view':
      Analytics.PageViewEvent();
      break;
    case 'search':
      Analytics.SearchEvent();
      break;
    case 'search_page_view':
      Analytics.PageViewFromSearchResultEvent();
      break;
    case 'page_click':
      Analytics.PageClickEvent();
      break;
    case 'page_first_scroll':
      Analytics.PageFirstScrollEvent();
      break;
    case 'toolbar_button_menu_click':
      Analytics.ToolbarButtonMenuClickEvent();
      break;
    case 'toolbar_button_search_click':
      Analytics.ToolbarButtonSearchClickEvent();
      break;
    case 'toolbar_button_search_cancel_click':
      Analytics.ToolbarButtonSearchCancelClickEvent();
      break;
    case 'toolbar_button_prev_click':
      Analytics.ToolbarButtonPrevClickEvent();
      break;
    case 'toolbar_button_next_click':
      Analytics.ToolbarButtonNextClickEvent();
      break;
    case 'toolbar_button_home_click':
      Analytics.ToolbarButtonHomeClickEvent();
      break;
    case 'toolbar_button_translate_click':
      Analytics.ToolbarButtonTranslateClickEvent();
      break;
    case 'menu_click_toc':
      Analytics.MenuTOCClickEvent();
      break;
    case 'menu_click_index':
      Analytics.MenuIndexClickEvent();
      break;
    case 'topic_lookup':
      Analytics.TopicLookupEvent();
      break;
    case 'page_helpful_button_click_yes':
      Analytics.PageHelpfulButtonYesClickEvent();
      break;
    case 'page_helpful_button_click_no':
      Analytics.PageHelpfulButtonNoClickEvent();
      break;
    case 'search_helpful_button_click_yes':
      Analytics.SearchHelpfulButtonYesClickEvent();
      break;
    case 'search_helpful_button_click_no':
      Analytics.SearchHelpfulButtonNoClickEvent();
      break;
    default:
      break;
  }

  Analytics.ClearEventData();
};

Analytics.ClearEventData = function () {
  'use strict';

  Analytics.event_type = '';
  Analytics.event_data = {};
};

// Get path to Reverb #page file
//
Analytics.GetEventLabel = function (param_page_path) {
  'use strict';

  var result, decoded_path;

  if (param_page_path.indexOf('#page/') > 0) {
    decoded_path = decodeURI(param_page_path);
    result = 'file: ' + decoded_path.substring(decoded_path.indexOf('#page/') + 6);
  } else if (param_page_path.indexOf('#search/') > 0) {
      result = 'search term(s): ' + Analytics.event_data.query;
  } else {
    result = 'file: ' + decodeURI(param_page_path);
  }

  return result;
};

// Track page view
//
Analytics.PageViewEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'page_view', { 'event_category': 'Reverb - Page', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.SearchEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label, query_path;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = 'search term(s): ' + Analytics.event_data.query;

  gtag('js', new Date());
  gtag('event', 'search', { 'event_category': 'Reverb - Search', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });

  // Simulate Google Analytics site-search page view notation
  //
  query_path = window.document.location.pathname + 'search?q=' + Analytics.event_data.query;
  query_path = encodeURI(query_path);
  gtag('event', 'page_view', {'page_path': query_path});
};

// Track page view that resulted from a search result click
//
  Analytics.PageViewFromSearchResultEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label, event_label2;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = 'search term(s): ' + Analytics.event_data.query;
  event_label2 = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click search result', { 'event_category': 'Reverb - Search', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true  });
  gtag('event', 'page_view', { 'event_category': 'Reverb - Page', 'event_label': event_label2, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.PageClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click content', {  'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.PageFirstScrollEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'scroll content', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path  });
};

Analytics.ToolbarButtonMenuClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Menu button', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonSearchClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Search button', { 'event_category': 'Reverb - Search', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonSearchCancelClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Search cancel button', { 'event_category': 'Reverb - Search', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonPrevClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Previous button', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonNextClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Next button', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonHomeClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Home button', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.ToolbarButtonTranslateClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Translate button', { 'event_category': 'Reverb - Page', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.MenuTOCClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Menu TOC', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.MenuIndexClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Menu Index', { 'event_category': 'Reverb - Navigation', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
};

Analytics.TopicLookupEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = 'context/topic: ' + Analytics.event_data.context + '/' + Analytics.event_data.topic;

  gtag('js', new Date());
  gtag('event', 'topic lookup', { 'event_category': 'Reverb - Topic Lookup', 'event_label': event_label, 'page_title': page_title, 'page_location': page_location, 'page_path': page_path, 'non_interaction': true });
 };

Analytics.PageHelpfulButtonYesClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Thumbs up', { 'event_category': 'Reverb - High Performing', 'event_label': event_label, 'value' : '1', 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.PageHelpfulButtonNoClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Thumbs down', { 'event_category': 'Reverb - Needs Improvement', 'event_label': event_label, 'value' : '1', 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.SearchHelpfulButtonYesClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Thumbs up', { 'event_category': 'Reverb - High Performing', 'event_label': event_label, 'value' : '1', 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};

Analytics.SearchHelpfulButtonNoClickEvent = function () {
  'use strict';

  var page_title, page_location, page_path, event_label;

  page_title = Analytics.event_data.title;
  page_location = Analytics.event_data.location;
  page_path = Analytics.event_data.path;
  event_label = Analytics.GetEventLabel(page_path);

  gtag('js', new Date());
  gtag('event', 'click Thumbs down', { 'event_category': 'Reverb - Needs Improvement', 'event_label': event_label, 'value' : '1', 'page_title': page_title, 'page_location': page_location, 'page_path': page_path });
};