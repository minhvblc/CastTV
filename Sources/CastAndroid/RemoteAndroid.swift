//
//  RemoteAndroid.swift
//  RemoteAndroid
//
//  Created by Minh Nguyễn on 13/06/2023.
//

import nodejs_ios
import NodeBridge
import NodeDecoder


public
class RemoteAndroid {
    private
    let nodePath = Bundle.main.path(forResource: "nodejs-project/main.js", ofType: "")
    private
    let nodeQueue = DispatchQueue(label: "nodejs")
    private
    var url: String? = ""
    private
    weak var delegate: RemoteAndroidDelegate?
    
    private
    init() {}
    
    public
    static let shared: RemoteAndroid = RemoteAndroid()
    
    public
    func connect(url: String) {
        nodeQueue.async {
            NodeRunner.startEngine(arguments: [
                "node",
                self.nodePath!
            ])
        }
        
        Addon.handler = { [weak self] env, value in
            let msg = "Node msg: \(env)-\(value)-\(Date())"
            self?.delegate?.didReceiveMessage(msg: msg)
            print(env, value, Date())
        }
        self.url = url
        callJS(dict: [
            "type": "pair",
            "host": url
        ])
    }
    
    public
    func disConnect() {
        guard let url else { return }
        callJS(dict: [
            "type": "disconnect",
            "host": url
        ])
    }
    
    private
    func callJS(dict: [String: String]) {
        Addon.callJS(dict: dict)
    } 
}

public
protocol RemoteAndroidDelegate: AnyObject {
    func didReceiveMessage(msg: String)
}
