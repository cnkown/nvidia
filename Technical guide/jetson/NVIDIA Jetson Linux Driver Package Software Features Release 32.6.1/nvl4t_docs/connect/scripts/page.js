// Copyright (c) 2010-2020 Quadralay Corporation.  All rights reserved.
//
// ePublisher 2020.1
//

// Page
//
var Page = {
  window: window,
  onload_handled: false,
  loading: true,
  height: 0,
  socialized: false,
  unloading_for_pdf: false
};

Page.KnownParcelURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelURL(Page.connect_info.parcel_prefixes, param_url);

  return result;
};

Page.KnownParcelBaggageURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelBaggageURL(Page.connect_info.parcel_prefixes, param_url);

  return result;
};

Page.BackToTop = function () {
  'use strict';

  var data;

  // Request parent window to scroll to the desired position
  //
  data = {
    'action': 'back_to_top'
  };
  Message.Post(Page.window.parent, data, Page.window);
};

Page.HandleToolbarLink = function (param_link) {
  'use strict';

  var result, behavior, data;

  result = true;

  if (typeof param_link.className === 'string') {
    // Determine handlers for button
    //
    for (behavior in Page.connect_info.button_behaviors) {
      if (typeof Page.connect_info.button_behaviors[behavior] === 'boolean') {
        if (Browser.ContainsClass(param_link.className, behavior)) {
          // Invoke handler
          //
          data = {
            'action': 'handle_toolbar_link',
            'behavior': behavior
          };
          Message.Post(Page.window.parent, data, Page.window);

          result = false;
          break;
        }
      }
    }
  }

  return result;
};

Page.HandleInterceptLink = function (param_link) {
  'use strict';

  var result, image_src, resolved_image_src, data;

  result = Page.HandleToolbarLink(param_link);
  if (result === true) {
    if (Browser.GetAttribute(param_link, 'wwx:original-href') !== null) {
      // Resolve path to full-size image
      //
      image_src = Browser.GetAttribute(param_link, 'wwx:original-href');
      resolved_image_src = Browser.ResolveURL(Page.window.location.href, image_src);

      // Display image
      //
      data = {
        'action': 'display_image',
        'href': param_link.href,
        'src': resolved_image_src,
        'width': parseInt(Browser.GetAttribute(param_link, 'wwx:original-width'), 10),
        'height': parseInt(Browser.GetAttribute(param_link, 'wwx:original-height'), 10)
      };
      Message.Post(Page.window.parent, data, Page.window);

      // Prevent default link behavior
      //
      result = false;
    } else {
      // Standard link
      //
      if (Browser.ContainsClass(param_link.className, 'ww_behavior_back_to_top')) {
        // Back to top
        //
        Page.BackToTop();

        // Prevent default link behavior
        //
        result = false;
      } else if ((param_link.href !== undefined) && (param_link.href !== null) && (param_link.href !== '')) {
        data = {
          'action': 'display_link',
          'href': param_link.href,
          'target': param_link.target
        };
        Message.Post(Page.window.parent, data, Page.window);

        // Prevent default link behavior
        //
        result = false;
      }
    }
  }

  return result;
};

Page.InterceptLink = function (param_event) {
  'use strict';

  var result;

  // PDF?
  //
  if (Browser.ContainsClass(this.className, 'ww_behavior_pdf')) {
    // Process normally
    //
    Page.unloading_for_pdf = true;
    result = true;
  } else {
    // Process event
    //
    result = Page.HandleInterceptLink(this);
  }

  return result;
};

Page.UpdateAnchors = function (param_document) {
  'use strict';

  var index, link, subject, message, mailto;

  if (Page.anchors_updated === undefined) {
    Page.anchors_updated = true;

    for (index = param_document.links.length - 1; index >= 0; index -= 1) {
      link = param_document.links[index];

      // Update targets
      //
      if (Browser.ContainsClass(link.className, 'ww_behavior_email')) {
        // Create email link
        //
        subject = Page.window.document.title;
        message = Page.connect_info.email_message.replace('$Location;', Page.window.location.href);
        if (Page.window.navigator.userAgent.indexOf('MSIE') !== -1) {
          subject = subject.replace('#', '%23');
          message = message.replace('#', '%23');
        }
        if (subject.length > 65) {
          subject = subject.substring(0, 62) + '...';
        }
        mailto =
          'mailto:' +
          Page.connect_info.email +
          '?subject=' +
          Browser.EncodeURIComponentIfNotEncoded(subject) +
          '&body=' + Browser.EncodeURIComponentIfNotEncoded(message);

        link.href = mailto;
      }

      else if (Browser.ContainsClass(link.className, 'ww_behavior_dropdown_toggle') && !Browser.ContainsClass(link.className, 'ww_skin_dropdown_toggle_disabled')) {
        link.onclick = ShowAll_Toggle;

      }

      else if (Browser.SameHierarchy(Page.connect_info.base_url, link.href)) {
        // Verify parcel is known
        //
        if (Page.KnownParcelURL(link.href)) {
          // Parcel is known
          //
          link.onclick = Page.InterceptLink;
        } else {
          // Unknown parcel
          //
          if (Page.preserve_unknown_file_links) {
            // Replace current window
            //
            if (!link.target) {
              link.target = Page.connect_info.target;
            }
          } else {
            Browser.RemoveAttribute(link, 'href', '');
          }
        }
      } else {
        // Link to external (non-parcel) content
        //

        // Assign window target if not already defined
        //
        if (!link.target) {
          // Replace current window
          //
          link.target = Page.connect_info.target;
        }
      }
    }

    // On click handlers for Mini-TOC
    //
    Browser.ApplyToChildElementsWithTagName(Page.window.document.body, 'div', function (param_div_element) {
      var decorate_onclick;

      // Mini-TOC entry?
      //
      decorate_onclick = false;
      if (Browser.ContainsClass(param_div_element.className, 'WebWorks_MiniTOC_Entry')) {
        decorate_onclick = true;
      }

      if (decorate_onclick) {
        // Add onclick to all parent elements of the link
        //
        Browser.ApplyToChildElementsWithTagName(param_div_element, 'a', function (param_anchor_element) {
          var parent_element;

          parent_element = param_anchor_element.parentNode;
          while (parent_element !== param_div_element) {
            parent_element.onclick = Page.HandleOnClickAsNestedAnchor;
            parent_element = parent_element.parentNode;
          }
          param_div_element.onclick = Page.HandleOnClickAsNestedAnchor;
        });
      }
    });

    // On click handlers for Related Topics
    //
    Browser.ApplyToChildElementsWithTagName(Page.window.document.body, 'dd', function (param_dd_element) {
      var decorate_onclick;

      // Related Topic entry?
      //
      decorate_onclick = false;
      if (Browser.ContainsClass(param_dd_element.className, 'Related_Topics_Entry')) {
        decorate_onclick = true;
      }

      if (decorate_onclick) {
        // Add onclick to all parent elements of the link
        //
        Browser.ApplyToChildElementsWithTagName(param_dd_element, 'a', function (param_anchor_element) {
          var parent_element;

          parent_element = param_anchor_element;
          while (parent_element !== param_dd_element.parentNode) {
            parent_element = parent_element.parentNode;
            parent_element.onclick = Page.HandleOnClickAsNestedAnchor;
          }
        });
      }
    });
  }
};

Page.GetPrevNext = function (param_document, param_prevnext) {
  'use strict';

  var result, link_href;

  try {
    link_href = Browser.GetLinkRelHREF(param_document, param_prevnext);
    if ((link_href !== '') && (link_href !== '#')) {
      // Ensure link is fully resolved
      // (workaround IE's compatibility view)
      //
      result = Browser.ResolveURL(param_document.location.href, link_href);
    }
  } catch (ignore) {
    // Ignore all errors!
    //
  }

  return result;
};

Page.SearchQueryHighlight = function (param_search_query, param_search_synonyms) {
  'use strict';

  var expressions, require_whitespace, html_elements, nodes_to_expand, first_node_to_expand, node_to_expand, dropdown_element;

  // Remove highlights
  //
  Highlight.RemoveFromDocument(Page.window.document, 'Search_Result_Highlight');

  // Highlight words
  //
  if (param_search_query !== undefined) {
    // Convert search query into expressions
    //
    expressions = SearchClient.SearchQueryToExpressions(param_search_query, param_search_synonyms);

    // Track nodes for possible expansion
    //
    nodes_to_expand = [];

    // Apply highlights
    //
    require_whitespace = true;
    html_elements = Page.window.document.getElementsByTagName('html');
    if (html_elements.length > 0) {
      require_whitespace = (html_elements[0].getAttribute('data-highlight-require-whitespace') === 'true');
    }
    Highlight.ApplyToDocument(Page.window.document, 'Search_Result_Highlight', expressions, require_whitespace, function (param_node) {
      nodes_to_expand.push(param_node);
    });

    // Track first node to highlight
    //
    first_node_to_expand = (nodes_to_expand.length > 0) ? nodes_to_expand[0] : null;

    // Expand nodes
    //
    while (nodes_to_expand.length > 0) {
      node_to_expand = nodes_to_expand.pop();

      // Inside dropdown?
      //
      dropdown_element = Page.InsideCollapsedDropdown(node_to_expand);
      if (dropdown_element !== undefined) {
        Page.RevealDropdownContent(dropdown_element);
      }
    }

    // Scroll to first highlighted node
    //
    if (first_node_to_expand !== null) {
      Page.first_highlight_element = first_node_to_expand;
      Page.ScrollElementIntoView(first_node_to_expand);
    }
  }
};

Page.InsideCollapsedDropdown = function (param_node) {
  'use strict';

  var result, current_node;

  result = undefined;
  current_node = param_node;
  while ((result === undefined) && (current_node !== undefined) && (current_node !== null)) {
    if (Browser.ContainsClass(current_node.className, 'ww_skin_page_dropdown_div_collapsed')) {
      result = current_node;
    }

    current_node = current_node.parentNode;
  }

  return result;
};

Page.RevealDropdownContent = function (param_dropdown_element) {
  'use strict';

  var dropdown_id_suffix_index, dropdown_id;

  // Expand dropdown
  //
  dropdown_id_suffix_index = param_dropdown_element.id.lastIndexOf(':dd');
  if (dropdown_id_suffix_index === (param_dropdown_element.id.length - 3)) {
    dropdown_id = param_dropdown_element.id.substring(0, dropdown_id_suffix_index);
    WebWorks_ToggleDIV(dropdown_id);
  }
};

Page.Listen = function (param_event) {
  'use strict';

  if (Page.dispatch === undefined) {
    Page.dispatch = {
      'page_load': function (param_data) {
        Page.Load();
      },
      'update_hash': function (param_data) {
        var data;

        // Update hash
        //
        if (Page.window.document.location.hash === param_data.hash) {
          // Hash is the same, still need to scroll
          //
          var element;

          try {
            element = document.querySelector(param_data.hash);

            if (element) {
              Page.ScrollElementIntoView(element);
            }
          } catch (ignore) {
            // ignore
          }
        } else {
          // Scroll will happen upon hash assignment
          Page.window.document.location.hash = param_data.hash;
        }

        // Page bookkeeping
        //
        data = {
          'action': 'page_bookkeeping',
          'href': Page.window.document.location.href,
          'hash': Page.window.document.location.hash
        };

        Message.Post(Page.window.parent, data, Page.window);
      },
      'update_anchors': function (param_data) {
        Page.connect_info = param_data;
        Page.UpdateAnchors(Page.window.document);
      },
      'page_set_max_width': function (param_data) {
        var data;

        // Set max width and overflow
        //
        if (Page.window.document.body.style.maxWidth !== param_data.max_width) {
          Page.window.document.body.style.maxWidth = param_data.max_width;
          if (Page.css_rule_overflow !== undefined) {
            Page.css_rule_overflow.style.overflowX = param_data.overflow;
          }
        }

        // Notify
        //
        data = {
          'action': 'notify_page_max_width_set'
        };
        Message.Post(Page.window.parent, data, Page.window);
      },
      'ww_behavior_print': function (param_data) {
        Page.window.print();
      },
      'ww_behavior_pdf': function (param_data) {
        var pdf_link, links, index, link, data;

        // Find PDF link
        //
        pdf_link = null;
        links = Page.window.document.body.getElementsByTagName('a');
        for (index = 0; index < links.length; index += 1) {
          link = links[index];

          if ((Browser.ContainsClass(link.className, 'ww_behavior_pdf')) && (link.href !== undefined) && (link.href.length > 0)) {
            // Found our link!
            //
            pdf_link = link;
            break;
          }
        }

        // PDF link found?
        //
        if (pdf_link !== null) {
          // Display link
          //
          data = {
            'action': 'display_link',
            'href': pdf_link.href,
            'target': pdf_link.target
          };
          Message.Post(Page.window.parent, data, Page.window);
        }
      },
      'page_socialize': function (param_data) {
        var social_links_div, twitter_anchor, twitter_href, twitter_span, twitter_iframe, facebook_anchor, facebook_href, facebook_span, facebook_iframe, linkedin_anchor, linkedin_href, linkedin_span, linkedin_script, first_script, disqus_div, disqus_script;

        // Handle file protocol
        //
        if (!Page.socialized && Page.window.document.location.protocol !== 'file:') {
          // Display social tools
          //
          social_links_div = Page.window.document.getElementById('social_links');
          if (social_links_div !== null) {
            social_links_div.style.display = 'inline-block';
          }

          // Twitter
          //
          if (social_links_div !== null) {
            twitter_anchor = Page.window.document.getElementById('social_twitter');
            if (twitter_anchor !== null) {
              twitter_href = 'https://twitter.com/intent/tweet?source=webclient&url=' + encodeURI(Page.window.document.location.href);
              twitter_anchor.href = twitter_href;
            }
          } else {
            twitter_span = Page.window.document.getElementById('social_twitter');
            if (twitter_span !== null) {
              twitter_iframe = Browser.FirstChildElementWithTagName(twitter_span, 'iframe');
              if (twitter_iframe !== null) {
                twitter_iframe.contentWindow.location.replace('http://platform.twitter.com/widgets/tweet_button.html?lang=en&count=horizontal&url=' + encodeURI(Page.window.document.location.href));
              }
            }
          }

          // FaceBook Like
          //
          if (social_links_div !== null) {
            facebook_anchor = Page.window.document.getElementById('social_facebook_like');
            if (facebook_anchor !== null) {
              facebook_href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURI(Page.window.document.location.href);
              facebook_anchor.href = facebook_href;
            }
          } else {
            // FaceBook Like
            //
            facebook_span = Page.window.document.getElementById('social_facebook_like');
            if (facebook_span !== null) {
              facebook_iframe = Browser.FirstChildElementWithTagName(facebook_span, 'iframe');
              if (facebook_iframe !== null) {
                facebook_iframe.contentWindow.location.replace('http://www.facebook.com/plugins/like.php?layout=button_count&show_faces=false&action=like&colorscheme=light&width=90&height=20&href=' + encodeURI(Page.window.document.location.href));
              }
            }
          }

          // LinkedIn Share
          //
          if (social_links_div !== null) {
            linkedin_anchor = Page.window.document.getElementById('social_linkedin');
            if (linkedin_anchor !== null) {
              linkedin_href = 'https://www.linkedin.com/shareArticle?url=' + encodeURI(Page.window.document.location.href);
              linkedin_anchor.href = linkedin_href;
            }
          } else {
            linkedin_span = Page.window.document.getElementById('social_linkedin');
            if (linkedin_span !== null) {
              linkedin_span.style.display = 'inline-block';
              linkedin_script = Page.window.document.createElement('script');
              linkedin_script.type = 'text/javascript';
              linkedin_script.async = true;
              linkedin_script.src = '//platform.linkedin.com/in.js';
              first_script = Page.window.document.getElementsByTagName('script')[0];
              first_script.parentNode.insertBefore(linkedin_script, first_script);
            }
          }

          // Disqus
          //
          if (param_data.disqus_id.length > 0) {
            try {
              disqus_div = Page.window.document.getElementById('disqus_thread');

              if (disqus_div !== null) {
                disqus_script = Page.window.document.createElement('script');
                disqus_script.type = 'text/javascript';
                disqus_script.async = true;
                disqus_script.src = 'https://' + param_data.disqus_id + '.disqus.com/embed.js';
                disqus_div.parentNode.appendChild(disqus_script);

                Page.disqus_div_height = disqus_div.scrollHeight;

                // set interval to check for disqus resizing
                //
                setInterval(function () {
                  var disqus_height = disqus_div.scrollHeight;

                  if (disqus_height !== Page.disqus_div_height) {
                    Page.disqus_div_height = disqus_height;

                    var data = {
                      'action': 'page_size',
                      'dimensions': Browser.GetWindowContentWidthHeight(Page.window)
                    };

                    Message.Post(Page.window.parent, data, Page.window);
                  }
                }, 100);
              }
            } catch (ex) {
              // Disqus load failed; moving on
            }
          }

          Page.socialized = true;
        }
      },
      'page_globalize': function (param_data) {
        var google_translate_div, google_translate_script;

        // Google Translation
        //
        google_translate_div = Page.window.document.getElementById('google_translate_element');
        if (google_translate_div !== null) {
          google_translate_script = Page.window.document.createElement('script');
          google_translate_script.type = 'text/javascript';
          google_translate_script.async = true;
          google_translate_script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          google_translate_div.appendChild(google_translate_script);
        }
      },
      'page_search_query_highlight': function (param_data) {
        Page.SearchQueryHighlight(param_data.search_query, param_data.search_synonyms);
      },
      'back_to_top': function (param_data) {
        // Scroll page to desired position
        //
        Page.BackToTop();
      },
      'page_assign': function (param_data) {
        // Assign new location to this page
        //
        Page.window.document.location.assign(param_data.href);
      },
      'page_replace': function (param_data) {
        // Replace new location to this page
        // and bypass history
        //
        Page.window.document.location.replace(param_data.href);
      },
      'page_load_data_complete': function (param_data) {
        // after the page is loaded we want to
        // scroll to the hash element if we can
        var element, scroll_position, data;

        try {
          element = document.querySelector(Page.window.document.location.hash);
        } catch (ignore) {
          // ignore
        }

        if (element) {
          scroll_position = Browser.GetElementScrollPosition(element);
        } else if (Page.first_highlight_element) {
          scroll_position = Browser.GetElementScrollPosition(Page.first_highlight_element);
        } else {
          scroll_position = {
            left: 0,
            top: 0
          };
        }

        // Request parent window to scroll to the desired position
        //
        data = {
          'action': 'page_load_scroll',
          'left': scroll_position.left,
          'top': scroll_position.top
        };

        Message.Post(Page.window.parent, data, Page.window);
      },
      'page_load_scroll_complete': function (param_data) {
        // safe to hook up events now
        //
        var data;

        Browser.TrackDocumentChanges(Page.window, Page.window.document, Page.ContentChanged);

        // Track hash changes
        //
        if ('onhashchange' in Page.window) {
          // Events are so nice!
          //
          Page.window.onhashchange = Page.HashChanged;
        } else {
          // Poll
          //
          Page.hash = Page.window.location.hash.substring(1);
          Page.poll_onhashchange = function () {
            var hash;

            hash = Page.window.location.hash.substring(1);
            if (hash !== Page.hash) {
              Page.hash = hash;

              Page.HashChanged();
            }

            Page.window.setTimeout(Page.poll_onhashchange, 100);
          };
          Page.window.setTimeout(Page.poll_onhashchange, 100);
        }

        Page.window.onresize = Page.ContentChanged;
        Page.loading = false;
        Page.window.document.body.style.visibility = 'visible';

        data = {
          'action': 'page_load_complete'
        };

        Message.Post(Page.window.parent, data, Page.window);
      }
    };
  }

  try {
    // Dispatch
    //
    Page.dispatch[param_event.data.action](param_event.data);
  } catch (ignore) {
    // Keep on rolling
    //
  }
};

Page.ScrollElementIntoView = function (param_element) {
  'use strict';

  var dropdown_element, scroll_position, data;

  // Inside dropdown?
  //
  dropdown_element = Page.InsideCollapsedDropdown(param_element);
  if (dropdown_element !== undefined) {
    Page.RevealDropdownContent(dropdown_element);
  }

  // Determine scroll position
  //
  scroll_position = Browser.GetElementScrollPosition(param_element);

  // Request parent window to scroll to the desired position
  //
  data = {
    'action': 'page_scroll_view',
    'left': scroll_position.left,
    'top': scroll_position.top
  };
  Message.Post(Page.window.parent, data, Page.window);
};

Page.ContentChanged = function () {
  'use strict';

  var data;

  data = {
    'action': 'page_size',
    'dimensions': Browser.GetWindowContentWidthHeight(Page.window)
  };

  Message.Post(Page.window.parent, data, Page.window);

  return true;
};

Page.HashChanged = function () {
  'use strict';

  var target_element_id, target_element;

  // Locate target element and update scroll position
  //
  target_element_id = (Page.window.location.hash.length > 1) ? Page.window.location.hash.substring(1) : '';
  if (target_element_id.length > 0) {
    target_element = Page.window.document.getElementById(target_element_id);
    if (target_element !== null) {
      Page.ScrollElementIntoView(target_element);
    } else {
      Page.BackToTop();
    }
  } else {
    Page.BackToTop();
  }

  return true;
};

Page.HandleOnClickAsNestedAnchor = function (param_event) {
  'use strict';

  var event, anchor_elements, data, anchor_element;

  // Access event
  //
  event = param_event || window.event;

  // Cancel event bubbling
  //
  event.cancelBubble = true;
  if (event.stopPropagation) {
    event.stopPropagation();
  }

  // Locate anchor and process link
  //
  anchor_elements = this.getElementsByTagName('a');
  if (anchor_elements.length > 0) {
    // Display link
    //
    anchor_element = anchor_elements[0];
    if ((anchor_element.href !== undefined) && (anchor_element.href !== null) && (anchor_element.href !== '')) {
      data = {
        'action': 'display_link',
        'href': anchor_element.href,
        'target': anchor_element.target
      };
      Message.Post(Page.window.parent, data, Page.window);
    }
  }
};


Page.SendHelpfulButtonClick = function (param_value) {
  'use strict';

  var data, helpful_rating_object, page_id;

  page_id = Page.window.document.body.id;

  helpful_rating_object = Browser.GetLocalStorageItem('page_helpful_rating');

  if (helpful_rating_object !== null) {

    page_id = Page.window.document.body.id;

    if (!helpful_rating_object.hasOwnProperty(page_id) || helpful_rating_object[page_id] !== param_value) {

      helpful_rating_object[page_id] = param_value;

      try {
        Browser.UpdateLocalStorageItem('page_helpful_rating', helpful_rating_object);
      } catch (ignore) {
        helpful_rating_object = {};
        helpful_rating_object[page_id] = param_value;
        Browser.DeleteLocalStorageItem('page_helpful_rating');
        Browser.CreateLocalStorageItem('page_helpful_rating', helpful_rating_object);
      }

      Page.SetSelectedStateForHelpfulButton(param_value);

      data = {
        'action': 'page_helpful_button_click',
        'helpful': param_value,
        'href': Page.window.document.location.href
      };

      Message.Post(Page.window.parent, data, Page.window);
    } else {
      //do nothing
    }
  }
};

Page.SendWindowClicked = function () {
  'use strict';

  var data;

  data = {
    'action': 'page_clicked'
  };
  Message.Post(Page.window.parent, data, Page.window);
};

Page.OnUnload = function () {
  'use strict';

  if (!Page.unloading_for_pdf) {
    var data;

    // Notify parent
    //
    data = {
      'action': 'page_unload'
    };

    Message.Post(Page.window.parent, data, Page.window);
  } else {
    Page.unloading_for_pdf = false;
  }
};

Page.HandleRedirect = function () {
  'use strict';

  var redirect_url, page_hash;

  if (Page.window === Page.window.top && Page.window.navigator.userAgent.indexOf('bot/') === -1) {
    // Redirect
    //
    var event_or_redirect_url;

    if (document.getElementById('page_onload_url')) {
      event_or_redirect_url = document.getElementById('page_onload_url').value;
    }

    if (event_or_redirect_url !== undefined && typeof event_or_redirect_url === 'string') {
      redirect_url = event_or_redirect_url;

      if (Page.window.document.location.hash.length > 1) {
        // Sanitize and append it
        //
        page_hash = Page.window.document.location.hash.substring(1);
        page_hash = page_hash.replace(/[\\<>:;"']|%5C|%3C|%3E|%3A|%3B|%22|%27/gi, '');
        redirect_url += '#' + page_hash;
      }

      Page.window.document.location.replace(redirect_url);
    }
  }
};

Page.Load = function () {
  'use strict';

  var skin_stylesheet, stylesheets_index, stylesheet, css_rules, css_rules_index, css_rule, css_rule_selector_text, stylesheet_element, back_to_top_element, helpful_button, unhelpful_button, data, helpful_rating;

    // Page loading
    //
    document.body.onresize = Page.ContentChanged;

    // Handle onload event only once
    //
    Page.onload_handled = true;

    // Track unload
    //
    Page.window.onunload = Page.OnUnload;

    // Find overflow CSS rule
    //
    Page.css_rule_overflow = undefined;
    try {
      // Locate skin stylesheet
      //
      skin_stylesheet = undefined;
      for (stylesheets_index = 0; stylesheets_index < Page.window.document.styleSheets.length; stylesheets_index += 1) {
        stylesheet = Page.window.document.styleSheets[stylesheets_index];

        // Avoid security exceptions if stylesheet on a different server
        //
        try {
          if ((typeof stylesheet.href === 'string') && (stylesheet.href.indexOf('skin.css') >= 0)) {
            skin_stylesheet = stylesheet;
            break;
          }
        } catch (ignore) {
          // Ignore
          //
        }
      }

      // Found skin stylesheet?
      //
      if (skin_stylesheet !== undefined) {
        css_rules = skin_stylesheet.cssRules;
        if (css_rules === undefined) {
          css_rules = skin_stylesheet.rules;
        }

        // Google Chrome bug?
        //
        // http://code.google.com/p/chromium/issues/detail?id=49001
        // If the stylesheet and the HTML are both on local disk, this bug occurs
        // (i.e. you get a null stylesheet from document.styleSheets).
        //
        if (css_rules === undefined || css_rules === null) {
          // Dynamically create a new stylesheet
          //
          stylesheet_element = Page.window.document.createElement('style');
          stylesheet_element.type = 'text/css';
          Page.window.document.head.appendChild(stylesheet_element);
          stylesheet = window.document.styleSheets[Page.window.document.styleSheets.length - 1];
          stylesheet.insertRule('.ww_skin_page_overflow { overflow-x: auto; overflow-y: hidden; min-width: 1px; }', stylesheet.cssRules.length);
          css_rules = stylesheet.cssRules;
        }

        // Find overflow rule
        //
        for (css_rules_index = 0; css_rules_index < css_rules.length; css_rules_index += 1) {
          css_rule = css_rules[css_rules_index];
          css_rule_selector_text = css_rule.selectorText.toLowerCase();  // Handle IE 7,8

          if (css_rule_selector_text === '.ww_skin_page_overflow') {
            Page.css_rule_overflow = css_rule;
          }
        }
      }
    } catch (ignore) {
      // Live without it
      //
    }

    // Hook up back to top
    //
    back_to_top_element = Page.window.document.getElementById('back_to_top');
    if (back_to_top_element !== null) {
      back_to_top_element.onclick = Page.BackToTop;
    }

    var dropdown_toggle_button = document.getElementById("show_hide_all");
    if (!!dropdown_toggle_button) {
      var dropdown_ids_element, dropdown_ids_string, dropdown_ids;

      dropdown_ids_element = document.getElementById('dropdown_ids');
      dropdown_ids_string = dropdown_ids_element.innerText;

      if (!!dropdown_ids_string) {
        dropdown_ids = dropdown_ids_string.split(',');
      } else {
        dropdown_ids = [];
      }

      if (document.getElementById('ww_related_topics')) {
        dropdown_ids.push('ww_related_topics');
      }

      Page.ShowAll = new ShowAll_Object(dropdown_ids);
      Page_Toggle_State();
    }

    Browser.CreateLocalStorageItem('page_helpful_rating', {});

    helpful_button = document.getElementById('helpful_thumbs_up');
    unhelpful_button = document.getElementById('helpful_thumbs_down');

    if (helpful_button !== null && unhelpful_button !== null) {
      helpful_button.onclick = function () { Page.SendHelpfulButtonClick('yes'); };
      unhelpful_button.onclick = function () { Page.SendHelpfulButtonClick('no'); };

      helpful_rating = Page.GetHelpfulRating();

      if (helpful_rating !== undefined) {
        Page.SetSelectedStateForHelpfulButton(helpful_rating);
      }
    }

    if (document.getElementById('disqus_developer_enabled')) {
      disqus_developer = 1;
    }

    if (document.getElementById('preserve_unknown_file_links')) {
      Page.preserve_unknown_file_links = document.getElementById('preserve_unknown_file_links').value === 'true';
    } else {
      Page.preserve_unknown_file_links = false;
    }

    // Notify parent
    //
    data = {
      'action': 'page_load_data',
      'dimensions': Browser.GetWindowContentWidthHeight(Page.window),
      'id': Page.window.document.body.id,
      'title': Page.window.document.title,
      'href': Page.window.document.location.href,
      'hash': Page.window.document.location.hash,
      'Prev': Page.GetPrevNext(Page.window.document, 'Prev'),
      'Next': Page.GetPrevNext(Page.window.document, 'Next')
    };
    Message.Post(Page.window.parent, data, Page.window);
};

Page.GetHelpfulRating = function () {
  'use strict';

  var page_id, helpful_rating, helpful_rating_object;
  helpful_rating = null;

  page_id = Page.window.document.body.id;
  helpful_rating_object = Browser.GetLocalStorageItem('page_helpful_rating');
  if (helpful_rating_object !== null) {
    if (helpful_rating_object.hasOwnProperty(page_id)) {
      helpful_rating = helpful_rating_object[page_id];
    }
  }

  return helpful_rating;
};

Page.SetSelectedStateForHelpfulButton = function (param_helpful_rating) {
  'use strict';

  var helpful_button, unhelpful_button;

  helpful_button = document.getElementById('helpful_thumbs_up');
  unhelpful_button = document.getElementById('helpful_thumbs_down');

  helpful_button.className = Browser.ReplaceClass(helpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');
  unhelpful_button.className = Browser.ReplaceClass(unhelpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');

  if (param_helpful_rating === 'yes') {
    helpful_button.className = Browser.ReplaceClass(helpful_button.className, 'ww_skin_was_this_helpful_button', 'ww_skin_was_this_helpful_button_selected');
  } else if (param_helpful_rating === 'no') {
    unhelpful_button.className = Browser.ReplaceClass(unhelpful_button.className, 'ww_skin_was_this_helpful_button', 'ww_skin_was_this_helpful_button_selected');
  }
};

// Dropdowns
//
function WebWorks_ToggleDIV(param_id) {
  'use strict';

  var dropdown_div_id, dropdown_arrow_id, dropdown_div, dropdown_a, dropdown_div_className, dropdown_a_className;

  // Update dropdown block
  //
  dropdown_div_id = param_id + ":dd";
  dropdown_div = window.document.getElementById(dropdown_div_id);
  if (dropdown_div !== null) {
    dropdown_div_className = dropdown_div.className.replace('ww_skin_page_dropdown_div_expanded', '').replace('ww_skin_page_dropdown_div_collapsed', '');
    if (dropdown_div.className.indexOf('ww_skin_page_dropdown_div_expanded') >= 0) {
      dropdown_div_className += 'ww_skin_page_dropdown_div_collapsed';
    } else {
      dropdown_div_className += 'ww_skin_page_dropdown_div_expanded';
    }
    dropdown_div.className = dropdown_div_className;
  }

  // Update dropdown arrow
  //
  dropdown_arrow_id = param_id + ":dd:arrow";
  dropdown_a = window.document.getElementById(dropdown_arrow_id);
  if (dropdown_a !== null) {
    dropdown_a_className = dropdown_a.className.replace(' ww_skin_page_dropdown_arrow_expanded', '').replace(' ww_skin_page_dropdown_arrow_collapsed', '');
    if (dropdown_a.className.indexOf('ww_skin_page_dropdown_arrow_expanded') >= 0) {
      dropdown_a_className += ' ww_skin_page_dropdown_arrow_collapsed';
    } else {
      dropdown_a_className += ' ww_skin_page_dropdown_arrow_expanded';
    }
    dropdown_a.className = dropdown_a_className;
  }

  Page_Toggle_State();

  return false;
}

// Page toggle button function
//

function ShowAll_Object(param_ids) {
  this.mDropDownIDs = param_ids;

  this.fToggle = ShowAll_Toggle;
}

function ShowAll_Toggle() {
  var showing, div_element, arrow_element;

  showing = this.className.indexOf('ww_skin_dropdown_toggle_open') > -1;

  for (var i = 0; i < Page.ShowAll.mDropDownIDs.length; i++) {
    div_element = document.getElementById(Page.ShowAll.mDropDownIDs[i] + ":dd");   //changed from document.all for FF support
    arrow_element = document.getElementById(Page.ShowAll.mDropDownIDs[i] + ":dd:arrow");   //changed from document.all for FF support

    if (div_element !== null && arrow_element !== null) {
      var div_class = div_element.getAttribute('class').replace('ww_skin_page_dropdown_div_expanded', '').replace('ww_skin_page_dropdown_div_collapsed', '');
      var arrow_class = arrow_element.getAttribute('class').replace(' ww_skin_page_dropdown_arrow_expanded', '').replace(' ww_skin_page_dropdown_arrow_collapsed', '');

      if (!showing) {
        div_class += 'ww_skin_page_dropdown_div_expanded';
        arrow_class += ' ww_skin_page_dropdown_arrow_expanded';
      }
      else {
        div_class += 'ww_skin_page_dropdown_div_collapsed';
        arrow_class += ' ww_skin_page_dropdown_arrow_collapsed';
      }

      div_element.setAttribute('class', div_class);
      arrow_element.setAttribute('class', arrow_class);
    }

    Page.ContentChanged();

  }
  Page_Toggle_State();
}

// State of Page Toggle Button
//
function Page_Toggle_State() {
  var currentState = document.getElementsByClassName("ww_skin_page_dropdown_arrow_collapsed").length;
  var dropdownExpandExists = document.getElementsByClassName("ww_skin_page_dropdown_arrow_expanded").length > 0;
  var dropdownCollapseExists = document.getElementsByClassName("ww_skin_page_dropdown_arrow_collapsed").length > 0;
  var dropdownsExist = dropdownExpandExists || dropdownCollapseExists;
  var action = "";

  if (dropdownsExist) {
    if (currentState >= 1) {
      action = "open";
    }
    else if (currentState === 0) {
      action = "close";
    }
  }
  else {
    action = "disabled";
  }

  Set_Toggle_State(action);
}


function Set_Toggle_State(action) {
  var page_toggle_button = document.getElementById('show_hide_all');
  var page_toggle_button_container = document.getElementById('dropdown_button_container');
  var page_toggle_button_class = page_toggle_button.getAttribute('class').replace('ww_skin_dropdown_toggle_open', '').replace('ww_skin_dropdown_toggle_closed', '').replace('ww_skin_dropdown_toggle_disabled', '');
  var page_toggle_button_container_class = page_toggle_button_container.getAttribute('class').replace('dropdown_button_container_enabled', '').replace('dropdown_button_container_disabled', '');

  switch (action) {
    case 'open':
      page_toggle_button_container_class += ' dropdown_button_container_enabled';
      page_toggle_button_container.setAttribute('class', page_toggle_button_container_class);
      page_toggle_button_class += ' ww_skin_dropdown_toggle_closed';
      page_toggle_button.setAttribute('class', page_toggle_button_class);
      break;
    case 'close':
      page_toggle_button_container_class += ' dropdown_button_container_enabled';
      page_toggle_button_container.setAttribute('class', page_toggle_button_container_class);
      page_toggle_button_class += ' ww_skin_dropdown_toggle_open';
      page_toggle_button.setAttribute('class', page_toggle_button_class);
      break;
    case 'disabled':
      page_toggle_button_container_class += ' dropdown_button_container_disabled';
      page_toggle_button_container.setAttribute('class', page_toggle_button_container_class);
      page_toggle_button_class += ' ww_skin_dropdown_toggle_disabled';
      page_toggle_button.setAttribute('class', page_toggle_button_class);
      break;
  }
}

var disqus_developer = 0;

// Google Translate Initialization
//
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
    pageLanguage: '',
    autoDisplay: true
  }, 'google_translate_element');
}

// Start running as soon as possible
//
if (window.addEventListener !== undefined) {
  window.addEventListener('load', Page.HandleRedirect, false);
} else if (window.attachEvent !== undefined) {
  window.attachEvent('onload', Page.HandleRedirect);
}

window.onclick = function (event) {
  Page.SendWindowClicked();
};

// Setup for listening
//
Message.Listen(Page.window, function (param_event) {
  Page.Listen(param_event);
});