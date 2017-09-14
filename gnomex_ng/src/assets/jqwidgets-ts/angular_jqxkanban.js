var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/*
jQWidgets v4.5.4 (2017-June)
Copyright (c) 2011-2017 jQWidgets.
License: http://jqwidgets.com/license/
*/
/// <reference path="jqwidgets.d.ts" />
import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';
var jqxKanbanComponent = (function () {
    function jqxKanbanComponent(containerElement) {
        this.autoCreate = true;
        this.properties = ['columnRenderer', 'columns', 'connectWith', 'headerHeight', 'headerWidth', 'height', 'itemRenderer', 'ready', 'rtl', 'source', 'resources', 'template', 'templateContent', 'theme', 'width'];
        // jqxKanbanComponent events
        this.onColumnAttrClicked = new EventEmitter();
        this.onColumnCollapsed = new EventEmitter();
        this.onColumnExpanded = new EventEmitter();
        this.onItemAttrClicked = new EventEmitter();
        this.onItemMoved = new EventEmitter();
        this.elementRef = containerElement;
    }
    jqxKanbanComponent.prototype.ngOnInit = function () {
        if (this.autoCreate) {
            this.createComponent();
        }
    };
    ;
    jqxKanbanComponent.prototype.ngOnChanges = function (changes) {
        if (this.host) {
            for (var i = 0; i < this.properties.length; i++) {
                var attrName = 'attr' + this.properties[i].substring(0, 1).toUpperCase() + this.properties[i].substring(1);
                var areEqual = void 0;
                if (this[attrName] !== undefined) {
                    if (typeof this[attrName] === 'object') {
                        if (this[attrName] instanceof Array) {
                            areEqual = this.arraysEqual(this[attrName], this.host.jqxKanban(this.properties[i]));
                        }
                        if (areEqual) {
                            return false;
                        }
                        this.host.jqxKanban(this.properties[i], this[attrName]);
                        continue;
                    }
                    if (this[attrName] !== this.host.jqxKanban(this.properties[i])) {
                        this.host.jqxKanban(this.properties[i], this[attrName]);
                    }
                }
            }
        }
    };
    jqxKanbanComponent.prototype.arraysEqual = function (attrValue, hostValue) {
        if (attrValue.length != hostValue.length) {
            return false;
        }
        for (var i = 0; i < attrValue.length; i++) {
            if (attrValue[i] !== hostValue[i]) {
                return false;
            }
        }
        return true;
    };
    jqxKanbanComponent.prototype.manageAttributes = function () {
        var options = {};
        for (var i = 0; i < this.properties.length; i++) {
            var attrName = 'attr' + this.properties[i].substring(0, 1).toUpperCase() + this.properties[i].substring(1);
            if (this[attrName] !== undefined) {
                options[this.properties[i]] = this[attrName];
            }
        }
        return options;
    };
    jqxKanbanComponent.prototype.createComponent = function (options) {
        if (options) {
            JQXLite.extend(options, this.manageAttributes());
        }
        else {
            options = this.manageAttributes();
        }
        this.host = JQXLite(this.elementRef.nativeElement.firstChild);
        this.__wireEvents__();
        this.widgetObject = jqwidgets.createInstance(this.host, 'jqxKanban', options);
        this.__updateRect__();
    };
    jqxKanbanComponent.prototype.createWidget = function (options) {
        this.createComponent(options);
    };
    jqxKanbanComponent.prototype.__updateRect__ = function () {
        this.host.css({ width: this.attrWidth, height: this.attrHeight });
    };
    jqxKanbanComponent.prototype.setOptions = function (options) {
        this.host.jqxKanban('setOptions', options);
    };
    // jqxKanbanComponent properties
    jqxKanbanComponent.prototype.columnRenderer = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('columnRenderer', arg);
        }
        else {
            return this.host.jqxKanban('columnRenderer');
        }
    };
    jqxKanbanComponent.prototype.columns = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('columns', arg);
        }
        else {
            return this.host.jqxKanban('columns');
        }
    };
    jqxKanbanComponent.prototype.connectWith = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('connectWith', arg);
        }
        else {
            return this.host.jqxKanban('connectWith');
        }
    };
    jqxKanbanComponent.prototype.headerHeight = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('headerHeight', arg);
        }
        else {
            return this.host.jqxKanban('headerHeight');
        }
    };
    jqxKanbanComponent.prototype.headerWidth = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('headerWidth', arg);
        }
        else {
            return this.host.jqxKanban('headerWidth');
        }
    };
    jqxKanbanComponent.prototype.height = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('height', arg);
        }
        else {
            return this.host.jqxKanban('height');
        }
    };
    jqxKanbanComponent.prototype.itemRenderer = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('itemRenderer', arg);
        }
        else {
            return this.host.jqxKanban('itemRenderer');
        }
    };
    jqxKanbanComponent.prototype.ready = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('ready', arg);
        }
        else {
            return this.host.jqxKanban('ready');
        }
    };
    jqxKanbanComponent.prototype.rtl = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('rtl', arg);
        }
        else {
            return this.host.jqxKanban('rtl');
        }
    };
    jqxKanbanComponent.prototype.source = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('source', arg);
        }
        else {
            return this.host.jqxKanban('source');
        }
    };
    jqxKanbanComponent.prototype.resources = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('resources', arg);
        }
        else {
            return this.host.jqxKanban('resources');
        }
    };
    jqxKanbanComponent.prototype.template = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('template', arg);
        }
        else {
            return this.host.jqxKanban('template');
        }
    };
    jqxKanbanComponent.prototype.templateContent = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('templateContent', arg);
        }
        else {
            return this.host.jqxKanban('templateContent');
        }
    };
    jqxKanbanComponent.prototype.theme = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('theme', arg);
        }
        else {
            return this.host.jqxKanban('theme');
        }
    };
    jqxKanbanComponent.prototype.width = function (arg) {
        if (arg !== undefined) {
            this.host.jqxKanban('width', arg);
        }
        else {
            return this.host.jqxKanban('width');
        }
    };
    // jqxKanbanComponent functions
    jqxKanbanComponent.prototype.addItem = function (newItem) {
        this.host.jqxKanban('addItem', newItem);
    };
    jqxKanbanComponent.prototype.destroy = function () {
        this.host.jqxKanban('destroy');
    };
    jqxKanbanComponent.prototype.getColumn = function (dataField) {
        return this.host.jqxKanban('getColumn', dataField);
    };
    jqxKanbanComponent.prototype.getColumnItems = function (dataField) {
        return this.host.jqxKanban('getColumnItems', dataField);
    };
    jqxKanbanComponent.prototype.getItems = function () {
        return this.host.jqxKanban('getItems');
    };
    jqxKanbanComponent.prototype.removeItem = function (itemId) {
        this.host.jqxKanban('removeItem', itemId);
    };
    jqxKanbanComponent.prototype.updateItem = function (itemId, newContent) {
        this.host.jqxKanban('updateItem', itemId, newContent);
    };
    jqxKanbanComponent.prototype.__wireEvents__ = function () {
        var _this = this;
        this.host.on('columnAttrClicked', function (eventData) { _this.onColumnAttrClicked.emit(eventData); });
        this.host.on('columnCollapsed', function (eventData) { _this.onColumnCollapsed.emit(eventData); });
        this.host.on('columnExpanded', function (eventData) { _this.onColumnExpanded.emit(eventData); });
        this.host.on('itemAttrClicked', function (eventData) { _this.onItemAttrClicked.emit(eventData); });
        this.host.on('itemMoved', function (eventData) { _this.onItemMoved.emit(eventData); });
    };
    return jqxKanbanComponent;
}()); //jqxKanbanComponent
__decorate([
    Input('columnRenderer'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrColumnRenderer", void 0);
__decorate([
    Input('columns'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrColumns", void 0);
__decorate([
    Input('connectWith'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrConnectWith", void 0);
__decorate([
    Input('headerHeight'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrHeaderHeight", void 0);
__decorate([
    Input('headerWidth'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrHeaderWidth", void 0);
__decorate([
    Input('itemRenderer'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrItemRenderer", void 0);
__decorate([
    Input('ready'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrReady", void 0);
__decorate([
    Input('rtl'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrRtl", void 0);
__decorate([
    Input('source'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrSource", void 0);
__decorate([
    Input('resources'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrResources", void 0);
__decorate([
    Input('template'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrTemplate", void 0);
__decorate([
    Input('templateContent'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrTemplateContent", void 0);
__decorate([
    Input('theme'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrTheme", void 0);
__decorate([
    Input('width'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrWidth", void 0);
__decorate([
    Input('height'),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "attrHeight", void 0);
__decorate([
    Input('auto-create'),
    __metadata("design:type", Boolean)
], jqxKanbanComponent.prototype, "autoCreate", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "onColumnAttrClicked", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "onColumnCollapsed", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "onColumnExpanded", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "onItemAttrClicked", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], jqxKanbanComponent.prototype, "onItemMoved", void 0);
jqxKanbanComponent = __decorate([
    Component({
        selector: 'jqxKanban',
        template: '<div><ng-content></ng-content></div>'
    }),
    __metadata("design:paramtypes", [ElementRef])
], jqxKanbanComponent);
export { jqxKanbanComponent };
//# sourceMappingURL=angular_jqxkanban.js.map