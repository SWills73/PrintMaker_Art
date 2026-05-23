// guipanel.js - Reusable GUI control panel for P5.js sketches
console.log("guipanel.js loaded");

class GUIPanel {
  constructor(options = {}) {
    this.x = options.x || width - 300;
    this.y = options.y || 20;
    this.w = options.width || 280;
    this.bgColor = options.bgColor || color(240, 240, 245, 250);
    this.textColor = options.textColor || color(20);
    this.accentColor = options.accentColor || color(100, 150, 250);
    this.sliderLiveInput = options.sliderLiveInput || false;
    this.onSliderInput = options.onSliderInput || null;
    this.onSliderCommit = options.onSliderCommit || null;

    this.groups = []; // Array of control groups
    this.collapsed = {}; // Track which groups are collapsed

    // Create DOM container
    this.container = createDiv();
    this.container.style("position", "absolute");
    this.container.style("right", "20px");
    this.container.style("top", "20px");
    this.container.style("width", this.w + "px");
    this.container.style("background-color", `rgba(240, 240, 245, 0.98)`);
    this.container.style("border-radius", "8px");
    this.container.style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)");
    this.container.style("padding", "15px");
    this.container.style("font-family", "Arial, sans-serif");
    this.container.style("font-size", "12px");
    this.container.style("z-index", "1000");
    this.container.style("max-height", "calc(100vh - 40px)");
    this.container.style("overflow-y", "auto");
  }

  /**
   * Add a new control group
   * @param {string} name - Group name
   * @param {boolean} startCollapsed - Whether group starts collapsed
   * @returns {object} Group object for chaining
   */
  addGroup(name, startCollapsed = false) {
    const group = {
      name: name,
      controls: [],
      collapsed: startCollapsed,
    };

    this.groups.push(group);
    this.collapsed[name] = startCollapsed;
    return group;
  }

  /**
   * Add a slider control to a group
   * @param {object} group - Group object from addGroup()
   * @param {string} label - Label for the slider
   * @param {object} variable - Object containing the variable (e.g., window or 'this')
   * @param {string} varName - Name of the variable to control
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} step - Step increment
   * @param {function} onChange - Optional callback when value changes
   */
  addSlider(
    group,
    label,
    variable,
    varName,
    min,
    max,
    step = 1,
    onChange = null,
    helpText = "",
    triggerOnInput = false,
  ) {
    const control = {
      type: "slider",
      label: label,
      variable: variable,
      varName: varName,
      min: min,
      max: max,
      step: step,
      onChange: onChange,
      helpText: helpText,
      triggerOnInput: triggerOnInput,
      element: null,
      valueDisplay: null,
    };

    group.controls.push(control);
    return control;
  }

  /**
   * Add a checkbox control to a group
   * @param {object} group - Group object from addGroup()
   * @param {string} label - Label for the checkbox
   * @param {object} variable - Object containing the variable
   * @param {string} varName - Name of the variable to control
   * @param {function} onChange - Optional callback when value changes
   */
  addCheckbox(group, label, variable, varName, onChange = null, helpText = "") {
    const control = {
      type: "checkbox",
      label: label,
      variable: variable,
      varName: varName,
      onChange: onChange,
      helpText: helpText,
      element: null,
    };

    group.controls.push(control);
    return control;
  }

  /**
   * Add a dropdown/select control to a group
   * @param {object} group - Group object from addGroup()
   * @param {string} label - Label for the dropdown
   * @param {object} variable - Object containing the variable
   * @param {string} varName - Name of the variable to control
   * @param {Array} options - Array of option values/labels
   * @param {function} onChange - Optional callback when value changes
   */
  addDropdown(
    group,
    label,
    variable,
    varName,
    options,
    onChange = null,
    helpText = "",
  ) {
    const control = {
      type: "dropdown",
      label: label,
      variable: variable,
      varName: varName,
      options: options,
      onChange: onChange,
      helpText: helpText,
      element: null,
    };

    group.controls.push(control);
    return control;
  }

  /**
   * Add a button to a group
   * @param {object} group - Group object from addGroup()
   * @param {string} label - Button label
   * @param {function} onClick - Callback when clicked
   */
  addButton(group, label, onClick, helpText = "") {
    const control = {
      type: "button",
      label: label,
      onClick: onClick,
      helpText: helpText,
      element: null,
    };

    group.controls.push(control);
    return control;
  }

  /**
   * Add a color picker control to a group
   * @param {object} group - Group object from addGroup()
   * @param {string} label - Label for the color picker
   * @param {object} variable - Object containing the variable
   * @param {string} varName - Name of the variable to control
   * @param {function} onChange - Optional callback when value changes
   * @param {string} helpText - Optional tooltip text
   */
  addColorPicker(
    group,
    label,
    variable,
    varName,
    onChange = null,
    helpText = "",
    options = {},
  ) {
    const control = {
      type: "color",
      label: label,
      variable: variable,
      varName: varName,
      onChange: onChange,
      helpText: helpText,
      options: options || {},
      element: null,
    };

    group.controls.push(control);
    return control;
  }

  /**
   * Build and display the GUI
   */
  build() {
    // Clear existing content
    this.container.html("");

    // Add title
    const title = createDiv("Controls");
    title.parent(this.container);
    title.style("font-size", "16px");
    title.style("font-weight", "bold");
    title.style("margin-bottom", "15px");
    title.style("color", "#333");

    // Build each group
    for (let group of this.groups) {
      this._buildGroup(group);
    }
  }

  /**
   * Build a single group with its controls
   * @private
   */
  _buildGroup(group) {
    // Group container
    const groupDiv = createDiv();
    groupDiv.parent(this.container);
    groupDiv.style("margin-bottom", "15px");
    groupDiv.style("border", "1px solid #ddd");
    groupDiv.style("border-radius", "6px");
    groupDiv.style("overflow", "hidden");

    // Group header (clickable to collapse/expand)
    const header = createDiv();
    header.parent(groupDiv);
    header.style("background-color", "#f8f8f8");
    header.style("padding", "10px");
    header.style("cursor", "pointer");
    header.style("font-weight", "bold");
    header.style("display", "flex");
    header.style("justify-content", "space-between");
    header.style("align-items", "center");
    header.style("user-select", "none");

    const headerText = createSpan(group.name);
    headerText.parent(header);

    const arrow = createSpan(this.collapsed[group.name] ? "▶" : "▼");
    arrow.parent(header);
    arrow.style("font-size", "10px");

    // Content container
    const contentDiv = createDiv();
    contentDiv.parent(groupDiv);
    contentDiv.style("padding", "10px");
    contentDiv.style("background-color", "white");
    contentDiv.style("display", this.collapsed[group.name] ? "none" : "block");

    // Toggle collapse on header click
    header.mousePressed(() => {
      this.collapsed[group.name] = !this.collapsed[group.name];
      contentDiv.style(
        "display",
        this.collapsed[group.name] ? "none" : "block",
      );
      arrow.html(this.collapsed[group.name] ? "▶" : "▼");
    });

    // Build controls
    for (let control of group.controls) {
      this._buildControl(control, contentDiv);
    }
  }

  /**
   * Build a single control
   * @private
   */
  _buildControl(control, parent) {
    const controlDiv = createDiv();
    controlDiv.parent(parent);
    controlDiv.style("margin-bottom", "12px");
    const tooltip = (control.helpText || "").trim();
    if (tooltip.length > 0) {
      controlDiv.attribute("title", tooltip);
    }

    if (control.type === "slider") {
      // Label
      const labelDiv = createDiv();
      labelDiv.parent(controlDiv);
      labelDiv.style("display", "flex");
      labelDiv.style("justify-content", "space-between");
      labelDiv.style("margin-bottom", "5px");

      const labelText = createSpan(control.label);
      labelText.parent(labelDiv);
      labelText.style("color", "#555");
      if (tooltip.length > 0) {
        labelText.attribute("title", tooltip);
      }

      const valueSpan = createSpan(control.variable[control.varName]);
      valueSpan.parent(labelDiv);
      valueSpan.style("color", "#333");
      valueSpan.style("font-weight", "bold");
      if (tooltip.length > 0) {
        valueSpan.attribute("title", tooltip);
      }
      control.valueDisplay = valueSpan;

      // Slider
      const slider = createSlider(
        control.min,
        control.max,
        control.variable[control.varName],
        control.step,
      );
      slider.parent(controlDiv);
      slider.style("width", "100%");
      if (tooltip.length > 0) {
        slider.attribute("title", tooltip);
      }
      control.element = slider;

      // Live label update while dragging (no expensive callback here)
      slider.input(() => {
        const value = Number(slider.value());
        control.variable[control.varName] = value;
        valueSpan.html(value);

        if (this.onSliderInput) {
          this.onSliderInput(control, value);
        }

        if (
          (control.triggerOnInput || this.sliderLiveInput) &&
          control.onChange
        ) {
          control.onChange(value);
        }
      });

      // Commit value + callback only when interaction is finished
      slider.changed(() => {
        const value = Number(slider.value());
        control.variable[control.varName] = value;
        valueSpan.html(value);
        if (this.onSliderCommit) {
          this.onSliderCommit(control, value);
        }

        if (
          !(control.triggerOnInput || this.sliderLiveInput) &&
          control.onChange
        ) {
          control.onChange(value);
        }
      });
    } else if (control.type === "checkbox") {
      // Checkbox with label
      const checkDiv = createDiv();
      checkDiv.parent(controlDiv);
      checkDiv.style("display", "flex");
      checkDiv.style("align-items", "center");

      const checkbox = createCheckbox("", control.variable[control.varName]);
      checkbox.parent(checkDiv);
      checkbox.style("margin-right", "8px");
      if (tooltip.length > 0) {
        checkbox.attribute("title", tooltip);
      }
      control.element = checkbox;

      const labelSpan = createSpan(control.label);
      labelSpan.parent(checkDiv);
      labelSpan.style("color", "#555");
      if (tooltip.length > 0) {
        labelSpan.attribute("title", tooltip);
      }

      // Update on change
      checkbox.changed(() => {
        const value = checkbox.checked();
        control.variable[control.varName] = value;
        if (control.onChange) {
          control.onChange(value);
        }
      });
    } else if (control.type === "dropdown") {
      // Label
      const labelDiv = createDiv(control.label);
      labelDiv.parent(controlDiv);
      labelDiv.style("color", "#555");
      labelDiv.style("margin-bottom", "5px");
      if (tooltip.length > 0) {
        labelDiv.attribute("title", tooltip);
      }

      // Dropdown/select
      const select = createSelect();
      select.parent(controlDiv);
      select.style("width", "100%");
      select.style("padding", "6px");
      select.style("border", "1px solid #ccc");
      select.style("border-radius", "4px");
      select.style("background-color", "white");
      select.style("cursor", "pointer");
      if (tooltip.length > 0) {
        select.attribute("title", tooltip);
      }
      control.element = select;

      // Add options
      for (let option of control.options) {
        select.option(option);
      }

      // Set initial value
      select.value(control.variable[control.varName]);

      // Update on change
      select.changed(() => {
        const value = select.value();
        control.variable[control.varName] = value;
        if (control.onChange) {
          control.onChange(value);
        }
      });
    } else if (control.type === "button") {
      // Button
      const btn = createButton(control.label);
      btn.parent(controlDiv);
      btn.style("width", "100%");
      btn.style("padding", "8px");
      btn.style("background-color", "#6495ed");
      btn.style("color", "white");
      btn.style("border", "none");
      btn.style("border-radius", "4px");
      btn.style("cursor", "pointer");
      btn.style("font-weight", "bold");
      if (tooltip.length > 0) {
        btn.attribute("title", tooltip);
      }
      control.element = btn;

      btn.mousePressed(() => {
        if (control.onClick) {
          control.onClick();
        }
      });

      // Hover effect
      btn.mouseOver(() => {
        btn.style("background-color", "#4169e1");
      });
      btn.mouseOut(() => {
        btn.style("background-color", "#6495ed");
      });
    } else if (control.type === "color") {
      const labelDiv = createDiv(control.label);
      labelDiv.parent(controlDiv);
      labelDiv.style("color", "#555");
      labelDiv.style("margin-bottom", "5px");
      if (tooltip.length > 0) {
        labelDiv.attribute("title", tooltip);
      }

      const rowDiv = createDiv();
      rowDiv.parent(controlDiv);
      rowDiv.style("display", "flex");
      rowDiv.style("align-items", "center");
      rowDiv.style("gap", "8px");

      if (control.options && control.options.checkbox) {
        const cbConfig = control.options.checkbox;
        const cb = createCheckbox("", !!cbConfig.variable[cbConfig.varName]);
        cb.parent(rowDiv);
        cb.style("margin", "0");
        cb.style("transform", "scale(1.05)");
        if (tooltip.length > 0) {
          cb.attribute("title", tooltip);
        }
        cb.changed(() => {
          const checked = cb.checked();
          cbConfig.variable[cbConfig.varName] = checked;
          if (cbConfig.onChange) {
            cbConfig.onChange(checked);
          }
        });
      }

      const picker = createColorPicker(control.variable[control.varName]);
      picker.parent(rowDiv);
      picker.style("width", "100%");
      picker.style("height", "32px");
      picker.style("border", "1px solid #ccc");
      picker.style("border-radius", "4px");
      picker.style("padding", "2px");
      picker.style("cursor", "pointer");
      if (tooltip.length > 0) {
        picker.attribute("title", tooltip);
      }
      control.element = picker;

      picker.input(() => {
        const value = picker.value();
        control.variable[control.varName] = value;
        if (control.onChange) {
          control.onChange(value);
        }
      });
    }
  }

  /**
   * Remove the GUI from the DOM
   */
  remove() {
    this.container.remove();
  }

  /**
   * Show the GUI
   */
  show() {
    this.container.style("display", "block");
  }

  /**
   * Hide the GUI
   */
  hide() {
    this.container.style("display", "none");
  }
}
