
import {AfterViewInit, Component, OnInit, ViewChild} from "@angular/core";
import {FormGroup,FormBuilder,Validators } from "@angular/forms"
import {PrimaryTab} from "../../util/tabs/primary-tab.component"
import {DataTrackService} from "../../services/data-track.service";
import {ActivatedRoute} from "@angular/router";
import {CreateSecurityAdvisorService} from "../../services/create-security-advisor.service";
import {URLSearchParams} from "@angular/http";
import {jqxEditorComponent} from "../../../assets/jqwidgets-ts/angular_jqxeditor";
import jqxComboBox = jqwidgets.jqxComboBox;
import {jqxComboBoxComponent} from "../../../assets/jqwidgets-ts/angular_jqxcombobox";
import {UserPreferencesService} from "../../services/user-preferences.service";



@Component({

    templateUrl:'./datatracks-folder.component.html'
})
export class DatatracksFolderComponent extends PrimaryTab implements OnInit, AfterViewInit{
    //Override
    public showSpinner:boolean = false;
    public readonly tbarSettings :string  ="bold italic underline | left center right |  format font size | color | ul ol | outdent indent";
    private toolBarSettings:string;
    private folderFormGroup: FormGroup;
    private labList:Array<string> = [];
    private idLabString: string;
    private description:string;
    @ViewChild('editorReference') myEditor: jqxEditorComponent;
    @ViewChild('comboBox')  myCombo: jqxComboBoxComponent;




    constructor(protected fb: FormBuilder,private dtService: DataTrackService,
                private route: ActivatedRoute,private secAdvisor: CreateSecurityAdvisorService,
                public prefService: UserPreferencesService){
        super(fb);
    }


    ngOnInit():void{ // Note this hook runs once if route changes to another folder you don't recreate component
        this.labList = this.dtService.labList;
        this.description = "TESTME PLEASE";

        if(this.secAdvisor.isGuest){
            this.toolBarSettings = '';
        }else{
            this.toolBarSettings = this.tbarSettings;
        }

        this.folderFormGroup=  this.fb.group({
            folderName:[{value:''  , disabled: this.secAdvisor.isGuest}, [ Validators.required, Validators.maxLength(100)]],
        });

        this.route.paramMap.forEach(params =>{
            let folderName = this.dtService.datatrackListTreeNode.name;
            this.folderFormGroup.get("folderName").setValue(folderName);
        });

    }

    ngAfterViewInit():void{


        this.route.paramMap.forEach(params =>{
            let description = this.dtService.datatrackListTreeNode.description;
            this.myEditor.val(description);
            setTimeout(()=>{
                this.myCombo.selectItem(this.dtService.datatrackListTreeNode.idLab);
                this.folderFormGroup.markAsPristine();
            });

        });
    }

    save():void{
        this.showSpinner = true;
        let params:URLSearchParams = new URLSearchParams();
        let idDataTrackFolder = this.dtService.datatrackListTreeNode.idDataTrackFolder;
        let name = this.folderFormGroup.get('folderName').value;

        params.set('idDataTrackFolder', idDataTrackFolder);
        params.set('description', this.description);
        params.set('name', name);
        params.set('idLab',this.idLabString);
        this.dtService.saveFolder(params).subscribe(resp =>{
            this.folderFormGroup.markAsPristine();
            this.showSpinner = false;
            this.dtService.getDatatracksList_fromBackend(this.dtService.previousURLParams);
        });
    }
    onSelect(event:any):void{
        if (event.args) {
            if (event.args.item && event.args.item.value) {
                this.idLabString = event.args.item.value;
                this.folderFormGroup.markAsDirty();
            }
        }else{
            this.idLabString = "";
        }
    }
    onUnselect(event:any):void{
        this.idLabString = "";
    }
    changed(event:any){
        console.log(event.args);
        this.folderFormGroup.markAsDirty();
    }

}




