/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {
    AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild
} from "@angular/core";

import { jqxWindowComponent } from "jqwidgets-framework";
import { jqxButtonComponent } from "jqwidgets-framework";
import { jqxComboBoxComponent } from "jqwidgets-framework";
import { jqxNotificationComponent  } from "jqwidgets-framework";
import { jqxCheckBoxComponent } from "jqwidgets-framework";
import {
    TreeComponent, ITreeOptions, TreeNode, TreeModel, IActionMapping,
    TREE_ACTIONS
} from "angular-tree-component";
import {Subscription} from "rxjs";
import {ActivatedRoute, NavigationExtras, Router} from "@angular/router";
import {ITreeNode} from "angular-tree-component/dist/defs/api";
import {LabListService} from "../services/lab-list.service";
import {DataTrackService} from "../services/data-track.service";
import {MoveDataTrackComponent} from "./move-datatrack.component";
import {MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material";
import * as _ from "lodash";
import {GnomexService} from "../services/gnomex.service";
import {URLSearchParams} from "@angular/http";
import {DialogsService} from "../util/popup/dialogs.service";

const actionMapping:IActionMapping = {
    mouse: {
        click: (tree, node, $event) => {
            $event.ctrlKey
                ? TREE_ACTIONS.TOGGLE_ACTIVE_MULTI(tree, node, $event)
                : TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, $event)
        }
    }
};

@Component({
    selector: "datatracks",
    templateUrl: "./browse-datatracks.component.html",
    styles: [`
        
        .short-width { width: 10em; }
        
        .padded { padding: 0.3em; }
        
        .left-right-padded {
            padding-left:  0.3em;
            padding-right: 0.3em;
        }
        .major-left-right-padded {
            padding-left:  1em;
            padding-right: 1em;
        }

        .vertical-spacer { height: 0.3em; }
        
        .foreground { background-color: white;   }
        .background { background-color: #EEEEEE; }
        
        .border { border: #C8C8C8 solid thin; }
        
        .major-border {
            border-radius: 0.3em;
            border: 1px solid darkgrey;
        }
        
        .small-font      { font-size: small; }
        
        .no-overflow { overflow: hidden; }
        
        .no-word-wrap { white-space: nowrap; }
        
    `]
})

export class BrowseDatatracksComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild("datatracksTree") treeComponent: TreeComponent;
    @ViewChild("labComboBox") labComboBox: jqxComboBoxComponent;
    @Output() selItem: EventEmitter<ITreeNode> = new EventEmitter();
    private treeModel: TreeModel;
    public moveDatatrackDialogRef: MatDialogRef<MoveDataTrackComponent>;
    private navInitSubscription: Subscription;

    /*
    angular2-tree options
     */
    public options: ITreeOptions = {
        displayField: "label",
        childrenField: "items",
        nodeClass: (node: TreeNode) => {
            return "icon-" + node.data.icon;
        },
        allowDrop: (element, {parent, index}) => {
            this.dragEndItems = _.cloneDeep(this.items);
            if (parent.data.parentid === -1 || parent.data.isGenomeBuild ||
                element.data.idDataTrackFolder === parent.data.idDataTrackFolder) {
                return false;
            } else {
                return true;
            }
        },

        allowDrag: (node) => node.data.isDataTrackFolder || node.data.idDataTrack,
        actionMapping
    };
    public items: any;
    public organisms: any;
    public currentItem: any;
    public targetItem: any;

    public labMembers: any;
    private billingAccounts: any;
    private selectedItem: ITreeNode;
    public datatracksCount: number = 0;
    private dataTracksListSubscription: Subscription;
    private labList: any[] = [];
    public disabled: boolean = true;
    public disableDelete: boolean = true;
    public searchText: string;
    private dragEndItems: any[] = [];
    private navDatatrackList: any;

    ngOnInit() {
        this.treeModel = this.treeComponent.treeModel;
        this.labListService.getLabList().subscribe((response: any[]) => {
            this.labList = response;
        });
    }

    ngAfterViewInit() {
    }

    constructor(private datatracksService: DataTrackService,
                private dialogsService: DialogsService,
                private router: Router,
                private route: ActivatedRoute,
                private labListService: LabListService,
                private dialog: MatDialog,
                private gnomexService:GnomexService,
                private changeDetectorRef: ChangeDetectorRef) {


        this.items = [];
        this.labMembers = [];
        this.billingAccounts = [];
        this.organisms = [];

        this.dataTracksListSubscription = this.datatracksService.getDatatracksListObservable().subscribe(response => {
            this.buildTree(response);
            let id = null;

            if(this.datatracksService.previousURLParams && this.datatracksService.previousURLParams["refreshParams"] ){ // this code occurs when searching
                let navArray:any[] = ['/datatracks', { outlets: { datatracksPanel: null }}];

                this.datatracksService.previousURLParams["refreshParams"] = false;
                this.datatracksService.datatrackListTreeNode = response;
                this.router.navigate(navArray);
            }



            setTimeout(_ => {
                //this.treeModel.expandAll();
                if(this.gnomexService.orderInitObj) { // this is if component is being navigated to by url
                    let id: string = "d" + this.gnomexService.orderInitObj.idDataTrack;
                    if (this.treeModel && id) {
                        let dtNode: ITreeNode = this.treeModel.getNodeById(id);
                        if(dtNode){
                            dtNode.ensureVisible();
                            dtNode.setIsActive(true);
                            dtNode.scrollIntoView();
                        }
                        this.gnomexService.orderInitObj = null;
                    }
                }
            });

        });


        this.navInitSubscription = this.gnomexService.navInitBrowseDatatrackSubject.subscribe( orderInitObj => {
            if(orderInitObj){
                let ids: URLSearchParams = new URLSearchParams;
                ids.set("number", this.gnomexService.orderInitObj.dataTrackNumber);
                ids.set("idOrganism", this.gnomexService.orderInitObj.idOrganism);
                ids.set("idLab", this.gnomexService.orderInitObj.idLab);
                ids.set("idGenomeBuild",this.gnomexService.orderInitObj.idGenomeBuild);
                this.datatracksService.previousURLParams = ids;
                this.datatracksService.getDatatracksList_fromBackend(ids);
            }else{
                this.datatracksService.getDatatracksList_fromBackend(new URLSearchParams());
            }
        });




        this.datatracksService.startSearchSubject.subscribe((value) =>{
            if (value) {
                this.dialogsService.startDefaultSpinnerDialog();
            }
        })
    }

    go(event: any) {
    }

    treeChangeFilter(event) {
    }

    /**
     * Reset the tree to the initial state.
     */
    resetTree() {
        this.items = this.dragEndItems;
    }

    onMoveNode($event) {
        console.log(
            "Moved",
            $event.node.name,
            "to",
            $event.to.parent.name,
            "at index",
            $event.to.index);
        this.currentItem = $event.node;
        this.targetItem = $event.to.parent;
        this.doMove($event);
    }

    doMove(event) {
        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.data = {
            currentItem: this.currentItem,
            targetItem: this.targetItem
        };

        this.moveDatatrackDialogRef= this.dialog.open(MoveDataTrackComponent, configuration);

        this.moveDatatrackDialogRef.afterClosed().subscribe(result => {
            if (this.moveDatatrackDialogRef.componentInstance.noButton) {
                this.resetTree();
            }
        });
    }

    treeUpdateData(event) {
        if (this.datatracksService.startSearchSubject.getValue() === true) {
            this.dialogsService.stopAllSpinnerDialogs();
            this.datatracksService.startSearchSubject.next(false);
            this.changeDetectorRef.detectChanges();
        }
    }

    search() {
        this.treeModel.filterNodes((node) => this.searchFn(node), true);
    }

    searchFn(node: any): boolean {
        if (node) {
            if (node.data.label.indexOf(this.searchText) >= 0 ||
                node.data.description && node.data.description.indexOf(this.searchText) >= 0) {
                return true;
            } else {
                return false;
            }
        }
    }

    /*
    Build the tree data
    @param
     */
    buildTree(response: any[]) {
        this.datatracksCount = 0;
        if (response) {
            this.organisms = [];
            this.items = [].concat(null);
            if (!this.isArray(response)) {
                this.items = [response];
            } else {
                this.items = response;
            }
            this.organisms = this.organisms.concat(this.items);
            for (var org of this.items) {
                org.id = "o"+org.idOrganism;
                org.parentid = -1;

                org.icon = "assets/organism.png";
                if (org.GenomeBuild) {
                    if (!this.isArray(org.GenomeBuild)) {
                        org.items = [org.GenomeBuild];
                    } else {
                        org.items = org.GenomeBuild;
                    }

                    for (var gNomeBuild of org.items) {
                        if (gNomeBuild) {
                            this.assignIconToGenomeBuild(gNomeBuild);
                            gNomeBuild.labId = org.labId;
                            gNomeBuild.id = "g"+gNomeBuild.idGenomeBuild;
                            gNomeBuild.parentid = org.id;
                            if (gNomeBuild.DataTrack) {
                                if (!this.isArray(gNomeBuild.DataTrack)) {
                                    gNomeBuild.items = [gNomeBuild.DataTrack];
                                } else {
                                    gNomeBuild.items = gNomeBuild.DataTrack;
                                }
                                for (var dataTrack of gNomeBuild.items) {
                                    if (dataTrack) {
                                        if (dataTrack.label) {
                                            this.assignIconToDT(dataTrack);
                                            dataTrack.parentid = gNomeBuild.id;
                                        } else {
                                            console.log("label not defined");
                                        }
                                    } else {
                                        console.log("a is undefined");
                                    }
                                }
                            }
                            if (gNomeBuild.DataTrackFolder) {
                                this.addDataTracksFromFolder(gNomeBuild, gNomeBuild.items);
                            }
                        }
                    }
                }
            }
        }
        this.dialogsService.stopAllSpinnerDialogs();
        if(this.treeModel){
            this.treeModel.clearFilter();
        }
    };

    addDataTracksFromFolder(root, items: any[]): any[] {
        var dtItems: any[] = [];
        if (!this.isArray(root.DataTrackFolder)) {
            root.DataTrackFolder = [root.DataTrackFolder];
        }
        if (!items) {
            items = [];
        }

        if (!this.isArray(items)) {
            items = [items];
        }
        for (var dtf of root.DataTrackFolder) {
            this.assignIconToDTFolder(dtf);
        }
        dtItems = dtItems.concat(root.DataTrackFolder);
        dtItems = dtItems.concat(items);
        root.items = dtItems;

        for (var dtf of root.items) {

            if (dtf.DataTrackFolder) {
                this.assignIconToDTFolder(dtf);
                this.addDataTracksFromFolder(dtf, dtf.DataTracks);
            }
            if (dtf.DataTrack) {
                if (!this.isArray(dtf.DataTrack)) {
                    dtf.DataTrack = [dtf.DataTrack];
                }
                for (var dt of dtf.DataTrack) {
                    this.assignIconToDT(dt);
                }
                if (dtf.items) {
                    dtf.items = dtf.items.concat(dtf.DataTrack);
                } else {
                    dtf.items = dtf.DataTrack;
                }
            }

        }

        return root;
    }

    assignIconToGenomeBuild(genomeBuild: any): void {
        if (genomeBuild.DataTrack || genomeBuild.DataTrackFolder) {
            genomeBuild.icon = "assets/genome_build.png";
        } else {
            genomeBuild.icon = "assets/genome_build_faded.png"
        }
        genomeBuild.isGenomeBuild = true;
    }

    assignIconToDTFolder(dtf: any): void {
        dtf.id = "df"+dtf.idDataTrackFolder;
        if (dtf.idLab) {
            dtf.icon = "assets/folder_group.png";
        } else {
            dtf.icon = "assets/folder.png";
        }
        dtf.isDataTrackFolder = true;
    }

    assignIconToDT(datatrack: any) {
        switch(datatrack.codeVisibility) {
            case 'MEM': {
                datatrack.icon = "assets/datatrack_member.png";
                break;
            }
            case 'OWNER': {
                datatrack.icon = "assets/datatrack_owner.png";
                break;
            }
            default: {
                datatrack.icon = "assets/datatrack_world.png";
                break;
            }
        }
        this.datatracksCount++;

        datatrack.id = "d"+datatrack.idDataTrack;
    }
    /*
        Determine if the object is an array
        @param what
     */
    isArray(what) {
        return Object.prototype.toString.call(what) === "[object Array]";
    };

    detailFn(): (keywords: string) => void {
        return (keywords) => {
            window.location.href = "http://localhost/gnomex/analysis/" + keywords;
        };
    }

    /**
     * A node is selected in the tree.
     * @param event
     */
    treeOnSelect(event: any) {
        this.selectedItem = event.node;
        this.selItem.emit(this.selectedItem);

        let datatrackListNode =  _.cloneDeep(this.selectedItem.data);
        this.datatracksService.datatrackListTreeNode = datatrackListNode;


        let navArray:Array<any> = [];


        if(datatrackListNode.isGenomeBuild){
            datatrackListNode["treeNodeType"] = "GenomeBuild";
            this.disableDelete = false;
            let idGenomeBuild:string = datatrackListNode.idGenomeBuild;

            navArray = ['/datatracks', {outlets:{'datatracksPanel':['genomeBuild',{'idGenomeBuild':idGenomeBuild}]}}];

        }else if (datatrackListNode.isDataTrackFolder){
            datatrackListNode["treeNodeType"] = "Folder";
            let idDataTrackFolder:string = datatrackListNode.idDataTrackFolder;
            navArray =['/datatracks', {outlets:{'datatracksPanel':['folder',{'idDataTrackFolder': idDataTrackFolder}]}}];
            this.disableDelete = false;
        }else if (this.selectedItem.isRoot){
            datatrackListNode["treeNodeType"] = "Organism";
            this.disableDelete = true;
            let idOrganism:string = datatrackListNode.idOrganism;
            navArray =['/datatracks', {outlets:{'datatracksPanel':['organism',{'idOrganism':idOrganism}]}}];
        }
        else{ // isLeaf
            //idDataTrack
            datatrackListNode["treeNodeType"] = "Datatrack";
            let idDataTrack:string = datatrackListNode.idDataTrack;
            this.disableDelete = false;
            navArray = ['/datatracks',  {outlets:{'datatracksPanel':[idDataTrack]}}];
        }

        this.router.navigate(navArray);


    }

    expandClicked() {
        this.selectedItem.expandAll();
    }

    collapseClicked() {
        this.selectedItem.collapseAll();
    }

    ngOnDestroy(): void {
        this.dataTracksListSubscription.unsubscribe();
        this.navInitSubscription.unsubscribe();
        //this.gnomexService.navInitBrowseDatatrackSubject.next(null);
        this.navDatatrackList = null;
    }
}
