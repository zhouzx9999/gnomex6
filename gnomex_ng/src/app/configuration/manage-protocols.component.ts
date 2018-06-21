import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material";
import {Router} from "@angular/router";

import {ITreeOptions, TreeComponent, TreeModel, TreeNode} from "angular-tree-component";

import {Subscription} from "rxjs/Subscription";

import {SpinnerDialogComponent} from "../util/popup/spinner-dialog.component";

import {DialogsService} from "../util/popup/dialogs.service";
import {DictionaryService} from "../services/dictionary.service";
import {ProtocolService} from "../services/protocol.service";
import {CreateProtocolDialogComponent} from "./create-protocol-dialog.component";

@Component({
    selector: 'manage-protocols',
    templateUrl: 'manage-protocols.component.html',
    styles: [`
        .flex-grow { flex: 1; }

        .t  { display: table; }
        .tr { display: table-row; }
        .td { display: table-cell; }
        
        .vertical-center { vertical-align: middle; }
        
        .padded { padding: 0.6em; }
        
        .padded-right { padding-right: 0.6em; }
        
        .padded-left-right {
            padding-left: 0.6em;
            padding-right: 0.6em;
        }
        .padded-top-bottom {
            padding-top: 0.6em;
            padding-bottom: 0.6em;
        }
        
        .border { border: 1px lightgray solid; }

        .no-overflow { overflow: hidden; }
        .right-align { text-align: right; }
        
        .checkbox-container {
            display: inline-block;
            vertical-align: middle;
            width: fit-content;
            padding: 0.2em 0.6em 0 0.6em;
        }
        
        .special-checkbox-text-alignment-padding {
            padding: 1.6em 0.6em 0 0;
        }
        .special-button-text-alignment-padding {
            padding: 1.1em 0.6em 0 0.6em;
        }
    `]
})
export class ManageProtocolsComponent implements OnInit, OnDestroy{

    @ViewChild("navigationTree") treeComponent: TreeComponent;

    private protocolSubscription: Subscription;
    private protocolListSubscription: Subscription;
    private deleteProtocolSubscription: Subscription;

    private selectedProtocol: any;
    private protocolList: any[];

    protected mainPaneTitle: string = 'Protocol:';
    protected protocolType: string = '';
    protected protocolName: string = '';

    private selectedProtocolName: string;
    private selectedProtocolUrl: string;
    private selectedExperimentPlatformCodeRequestCategory: string;
    private selectedProtocolDescription: string;

    protected selectedProtocolIdAnalysisType: string;
    protected selectedProtocolIdAppUser: string;

    protected analysisTypeList: any[];
    protected userList: any[];

    private experimentPlatformList: any[];

    private activeCheckBox: boolean = false;

    private disableViewURLButton: boolean = true;

    private treeOptions: ITreeOptions = {
        idField: "idComposite",
        displayField: "label",
        childrenField: "Protocol"
    };

    private treeModel: TreeModel;

    private mostRecentlySelectedTreeItem: any;

    private mostRecentlyDisplayedProtocolId: string;
    private mostRecentlyDisplayedProtocolProtocolClassName: string;

    private spinnerRef: MatDialogRef<SpinnerDialogComponent>;

    private spinnerNeedsToWaitForList: boolean = false;
    private spinnerNeedsToWaitForProtocol: boolean = false;


    constructor(private dialog: MatDialog,
                private dialogService: DialogsService,
                private dictionaryService: DictionaryService,
                private protocolService: ProtocolService,
                private router: Router) { }

    ngOnInit(): void {
        this.treeModel = this.treeComponent.treeModel;

        if (!this.protocolSubscription) {
            this.protocolSubscription = this.protocolService.getProtocolObservable().subscribe((result) => {
                this.selectedProtocol = result;
                this.selectedProtocolName = !!result.name ? '' + result.name: '';
                this.selectedProtocolUrl  = !!result.url  ? '' + result.url:  '';
                this.activeCheckBox       = ('' + result.isActive).toLowerCase() === 'y';
                this.selectedExperimentPlatformCodeRequestCategory = result.codeRequestCategory;
                this.selectedProtocolDescription = !!result.description ? '' + result.description: '';

                if (this.selectedProtocolUrl && this.selectedProtocolUrl !== "") {
                    this.disableViewURLButton = false;
                } else {
                    this.disableViewURLButton = true;
                }
                if (result.idAnalysisType && result.idAnalysisType !== '') {
                    this.selectedProtocolIdAnalysisType = result.idAnalysisType;
                } else {
                    this.selectedProtocolIdAnalysisType = '';
                }

                this.spinnerNeedsToWaitForProtocol = false;
                if (!this.spinnerNeedsToWaitForList && !this.spinnerNeedsToWaitForProtocol) {
                    this.spinnerRef.close();
                }
            });
        }

        if (!this.protocolListSubscription) {
            this.protocolListSubscription = this.protocolService.getProtocolListObservable().subscribe((list) => {
                this.prepareTreeNodes(list);

                setTimeout(() => {
                    this.treeModel.expandAll();

                    this.spinnerNeedsToWaitForList = false;
                    if (!this.spinnerNeedsToWaitForList && !this.spinnerNeedsToWaitForProtocol) {
                        this.spinnerRef.close();
                    }
                });
            });

            setTimeout(() => {
                this.spinnerNeedsToWaitForList     = true;
                this.spinnerNeedsToWaitForProtocol = false;
                this.spinnerRef = this.dialogService.startDefaultSpinnerDialog();

                this.protocolService.getProtocolList();
            });
        }

        if (!this.deleteProtocolSubscription) {
            this.deleteProtocolSubscription = this.protocolService.getDeleteProtocolObservable().subscribe((result) => {
                this.spinnerRef.close();
                this.selectedProtocol = null;
                this.mainPaneTitle = 'Protocol:';
                this.mostRecentlyDisplayedProtocolId = '';
                this.mostRecentlyDisplayedProtocolProtocolClassName = '';

                this.refresh();
            });
        }

        this.experimentPlatformList = this.dictionaryService.getEntriesExcludeBlank(DictionaryService.REQUEST_CATEGORY);
        this.analysisTypeList = this.dictionaryService.getEntriesExcludeBlank(DictionaryService.ANALYSIS_TYPE);
        this.userList = this.dictionaryService.getEntriesExcludeBlank(DictionaryService.APP_USER);
    }

    ngOnDestroy(): void {
        if (this.protocolSubscription) {
            this.protocolSubscription.unsubscribe();
        }
        if (this.protocolListSubscription) {
            this.protocolListSubscription.unsubscribe();
        }
        if (this.deleteProtocolSubscription) {
            this.deleteProtocolSubscription.unsubscribe();
        }
    }

    private prepareTreeNodes(list: any[]) {
        this.protocolList = list;
        this.mostRecentlySelectedTreeItem = null;

        if (this.protocolList) {
            for (let protocolFolder of this.protocolList) {
                protocolFolder.icon = '../../assets/folder.png';
                protocolFolder.isProtocol = 'N';
                protocolFolder.idComposite = '' + protocolFolder.label;
                protocolFolder.protocolType = '' + protocolFolder.label;
                protocolFolder.protocolClassName = '' + protocolFolder.protocolClassName;

                if (!this.mostRecentlySelectedTreeItem) {
                    this.mostRecentlySelectedTreeItem = protocolFolder;
                }

                if(!!protocolFolder.Protocol) {
                    if (!Array.isArray(protocolFolder.Protocol)) {
                        protocolFolder.Protocol = [protocolFolder.Protocol];
                    }

                    for (let protocol of protocolFolder.Protocol) {
                        protocol.icon = '../../assets/brick.png';
                        protocol.isProtocol = 'Y';
                        protocol.idComposite = '' + protocol.id + protocolFolder.label;

                        protocol.protocolType = '' + protocolFolder.label;
                        protocol.protocolClassName = '' + protocolFolder.protocolClassName
                    }
                }
            }
        }
    }

    private treeOnSelect(event: any) {
        if (event
            && event.node
            && event.node.data
            && event.node.data.id
            && event.node.data.protocolClassName
            && event.node.data.isProtocol
            && event.node.data.isProtocol === 'Y') {

            this.spinnerNeedsToWaitForList     = false;
            this.spinnerNeedsToWaitForProtocol = true;
            this.spinnerRef = this.dialogService.startDefaultSpinnerDialog();

            this.mostRecentlyDisplayedProtocolId                = event.node.data.id;
            this.mostRecentlyDisplayedProtocolProtocolClassName = event.node.data.protocolClassName;

            if (event.node.data.idAppUser && event.node.data.idAppUser !== '') {
                this.selectedProtocolIdAppUser = event.node.data.idAppUser;
            } else {
                this.selectedProtocolIdAppUser = '';
            }

            this.protocolService.getProtocolByIdAndClass(event.node.data.id, event.node.data.protocolClassName);

            if (event.node.parent
                && event.node.parent.data
                && event.node.data
                && event.node.data.label
                && event.node.data.label !== '') {
                this.protocolType = event.node.parent.data.label;
                this.protocolName = event.node.data.label;
                this.mainPaneTitle = '' + event.node.parent.data.label + ': ' + event.node.data.label;
            }
        } else {
            this.mainPaneTitle = 'Protocol:'
        }

        if (event && event.node && event.node.data) {
            this.mostRecentlySelectedTreeItem = event.node.data;
        }
    }

    private checkToEnableViewURLButton(event: any) {
        if (event && event.currentTarget && event.currentTarget.value && event.currentTarget.value !== "") {
            this.disableViewURLButton = false;
        } else {
            this.disableViewURLButton = true;
        }
    }

    private onNewProtocolButtonClicked() {

        let data: any = {
            protocolType: '',
            protocolClassName : ''
        };

        if (!!this.mostRecentlySelectedTreeItem) {
            data.protocolType      = this.mostRecentlySelectedTreeItem.protocolType;
            data.protocolClassName = this.mostRecentlySelectedTreeItem.protocolClassName;
        }

        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.width = '30em';
        configuration.panelClass = 'no-padding-dialog';
        configuration.data = data;

        let dialogReference = this.dialog.open(CreateProtocolDialogComponent, configuration);

        dialogReference.afterClosed().subscribe((result) => {
            if (result
                && result.reloadTree
                && result.idProtocol
                && result.idProtocol !== ''
                && result.protocolClassName
                && result.protocolClassName !== '') {

                this.mostRecentlyDisplayedProtocolId = result.idProtocol;
                this.mostRecentlyDisplayedProtocolProtocolClassName = result.protocolClassName;
                this.refresh();
            } else {
                // Assume that the popup closed by cancelling. Do nothing.
            }
        });
    }
    private onDeleteProtocolButtonClicked() {
        if (this.mostRecentlyDisplayedProtocolId
            && this.mostRecentlyDisplayedProtocolId !== ''
            && this.mostRecentlyDisplayedProtocolProtocolClassName
            && this.mostRecentlyDisplayedProtocolProtocolClassName !== '') {

            let lines: string[] = [
                "Are you sure you want to delete the ",
                "" + this.protocolType + ":",
                "" + this.protocolName + "?"
            ];

            this.dialogService.yesNoDialog(lines, this, "onConfirmDelete")
        }
    }
    private onConfirmDelete() {
        if (this.mostRecentlyDisplayedProtocolId
            && this.mostRecentlyDisplayedProtocolId !== ''
            && this.mostRecentlyDisplayedProtocolProtocolClassName
            && this.mostRecentlyDisplayedProtocolProtocolClassName !== '') {
            this.protocolService.deleteProtocol(this.mostRecentlyDisplayedProtocolId, this.mostRecentlyDisplayedProtocolProtocolClassName);
        } else {
            this.dialogService.alert("Error : No selected protocol");
        }
    }
    private onRefreshButtonClicked() {
        this.refresh();
    }
    private onViewURLButtonClicked() {
        window.open(this.selectedProtocolUrl, '_blank');
    }
    private onSaveButtonClicked() {
        if (this.selectedProtocol) {
            this.protocolService.saveExistingProtocol(
                '' + this.selectedProtocolName,
                '',
                '' + this.selectedProtocolDescription,
                '' + this.selectedProtocolIdAnalysisType,
                '',
                '' + this.mostRecentlyDisplayedProtocolProtocolClassName,
                '' + this.selectedExperimentPlatformCodeRequestCategory,
                '' + this.selectedProtocolIdAppUser,
                (this.activeCheckBox ? 'Y' : 'N'),
                '' + this.mostRecentlyDisplayedProtocolId,
                '' + this.selectedProtocolUrl
            );
        }
    }

    private refresh(): void {
        this.spinnerRef = this.dialogService.startDefaultSpinnerDialog();

        this.spinnerNeedsToWaitForList = true;

        if (this.mostRecentlyDisplayedProtocolId && this.mostRecentlyDisplayedProtocolProtocolClassName) {
            this.spinnerNeedsToWaitForProtocol = true;

            this.protocolService.getProtocolByIdAndClass(this.mostRecentlyDisplayedProtocolId, this.mostRecentlyDisplayedProtocolProtocolClassName);
        }
        this.protocolService.getProtocolList();
    }

}