﻿using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System.IO;
using TMPro;
public class ProjectFileViewerPanel : MonoBehaviour {
    public FrameFileViewer FrameViewer;
    public ImageFileViewer ImageViewer;
    public TextFileViewer TextViewer;
    public GameObject IncompatibleTypeLabel;
    public GameObject NotFoundLabel;
    public MainPanelController PanelController;

    public void XButton_OnClick() {
        PanelController.CloseButton_OnClick();
    }

    public void Show(string filePath) {
        IncompatibleTypeLabel.SetActive(false);
        if (!File.Exists(filePath)) {
            NotFoundLabel.SetActive(true);
            return;
        }
        PanelController.OpenButton_OnClick(5);
        
        string extension = Path.GetExtension(filePath);
        switch (extension) {
            case "json":
                FrameViewer.Show(filePath);
                break;
            case "png":
                ImageViewer.Show(filePath);
                break;
            case "jpg":
                ImageViewer.Show(filePath);
                break;
            case "":
                goto default;
            case "mp4":
                goto case "incompatible";
            case "wav":
                goto case "incompatible";
            case "tif":
                goto case "incompatible";
            case "gif":
                goto case "incompatible";
            case "tiff":
                goto case "incompatible";
            case "bson":
                goto case "incompatible";
            case "bin":
                goto case "incompatible";
            case "dat":
                goto case "incompatible";
            case "mp3":
                goto case "incompatible";
            case "incompatible":
                IncompatibleTypeLabel.SetActive(true);
                break;
            default:
                TextViewer.Show(filePath);
                break;
        }
    }
}
