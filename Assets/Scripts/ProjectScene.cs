﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using TMPro;
using UnityEngine;

public class ProjectScene : MonoBehaviour {
    public static string StartupProjectPath;
    public static string CurrentProjectPath;

    public static ProjectManifest projectManifest;
    public bool modified;

    public PointCloudManager pointCloudManager;
    public FrameManager frameManager;

    public GameObject CreateNewProjectPanel;
    public GameObject OpenProjectPanel;
    public GameObject SaveAsProjectPanel;

    DirectoryInfo CurrentProject;
    void Start() {
        CurrentProjectPath = StartupProjectPath;
        bool existingManifestExists = File.Exists(StartupProjectPath + "/manifest.json");
        if (existingManifestExists) 
            PrepareExistingProject(StartupProjectPath);
        if (!existingManifestExists)
            PrepareNewProject(StartupProjectPath);
    }
    public void PrepareNewProject(string directory) {
        projectManifest = new ProjectManifest();
        CurrentProject = new DirectoryInfo(directory);
        projectManifest.Name = CurrentProject.Name;
        projectManifest.Created = DateTime.Now;
        projectManifest.Modified = DateTime.Now;
        projectManifest.Description = "NOT IMPLEMENTED";
        projectManifest.Frames = new List<string>();

        Directory.CreateDirectory(directory);
        string manifestFileString = JsonConvert.SerializeObject(projectManifest);
        if (File.Exists(directory + "/manifest.json"))
            File.Delete(directory + "/manifest.json");
        File.WriteAllText(directory + "/manifest.json", manifestFileString);

        Directory.CreateDirectory(directory + @"\Frames Folder");
    }

    public void PrepareExistingProject(string directory) {
        string manifestFileContents = File.ReadAllText(directory + "/manifest.json");
        projectManifest = JsonConvert.DeserializeObject<ProjectManifest>(manifestFileContents);
        try { FrameManager.Frames.Clear(); }
        catch { }
        foreach (string frameFilePath in projectManifest.Frames)
            FrameManager.Frames.Add(new FrameData(frameFilePath));
    }
    
    public void NewProjectButton_OnClick()
    {
        CreateNewProjectPanel.SetActive(true);
    }
    public void OpenProjectButton_onClick()
    {
        OpenProjectPanel.SetActive(true);
    }
    public void SaveAsProject_OnClick()
    {
        SaveAsProjectPanel.SetActive(true);
    }
    public void NewProject() {
        CurrentProjectPath = StartupProjectPath;
        PrepareNewProject(CurrentProjectPath); 
    }

    public void SaveProject() {
        projectManifest.Modified = DateTime.Now;
        string manifestInformation = JsonConvert.SerializeObject(projectManifest);

        File.WriteAllText(CurrentProjectPath + @"\manifest.json", manifestInformation);
    }

    public static string projectName;
    public void SaveAsProject(TextMeshProUGUI directory)
    {
        DirectoryInfo newProjectDirectory = Directory.CreateDirectory(directory.text + @"\" + projectName);

        Directory.CreateDirectory(directory.text + @"\" + projectName + @"\Frames Folder");

        DirectoryInfo FramesFolder = new DirectoryInfo(CurrentProject + @"\Frames Folder");

        foreach (FileInfo frame in FramesFolder.GetFiles())
            frame.CopyTo(newProjectDirectory + @"\Frames Folder" + @"\" + frame.Name);
        foreach (FileInfo manifest in CurrentProject.GetFiles())
            manifest.CopyTo(newProjectDirectory + @"\" + manifest.Name);
    }

    public void LoadProject() {
        CurrentProjectPath = StartupProjectPath;
        PrepareExistingProject(CurrentProjectPath);
    }
}

[Serializable]
public class ProjectManifest {
    public string Name;
    public string Description;
    public DateTime Created;
    public DateTime Modified;
    public List<string> Frames = new List<string>();
}